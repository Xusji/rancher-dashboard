import semver from 'semver';
import { camelToTitle } from '@shell/utils/string';
import { CAPI } from '@shell/config/labels-annotations';
import { MANAGEMENT, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { PaginationFilterField, PaginationParamFilter } from 'types/store/pagination.types';

/**
 * Combination of paginationFilterHiddenLocalCluster and paginationFilterOnlyKubernetesClusters
 *
 * @param {*} store
 * @returns PaginationParam[]
 */
export function paginationFilterClusters(store) {
  // TODO: RC (home page/side bar) TEST both facets
  const paginationRequestFilters = [];
  const pFilterOnlyKubernetesClusters = paginationFilterOnlyKubernetesClusters(store);
  const pFilterHiddenLocalCluster = paginationFilterHiddenLocalCluster(store);

  if (pFilterOnlyKubernetesClusters) {
    paginationRequestFilters.push(pFilterOnlyKubernetesClusters);
  }
  if (pFilterHiddenLocalCluster) {
    paginationRequestFilters.push(pFilterHiddenLocalCluster);
  }

  return paginationRequestFilters;
}

/**
 * The vai backed api's `filter` equivalent of `filterHiddenLocalCluster`
 *
 * @export
 * @param {*} store
 * @returns PaginationParam | null
 */
export function paginationFilterHiddenLocalCluster(store) {
  const hideLocalSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
  const value = hideLocalSetting.value || hideLocalSetting.default || 'false';
  const hideLocal = value === 'true';

  if (!hideLocal) {
    return null;
  }

  return PaginationParamFilter.createMultipleFields([
    new PaginationFilterField({
      field: `spec.internal`, // Pending API support https://github.com/rancher/rancher/issues/48011
      value: false,
    }),
  ]);
}

/**
 * The vai backed api's `filter` equivalent of `filterOnlyKubernetesClusters`
 *
 * @export
 * @param {*} store
 * @returns PaginationParam | null
 */
export function paginationFilterOnlyKubernetesClusters(store) {
  const openHarvesterContainerWorkload = store.getters['features/get']('harvester-baremetal-container-workload');

  if (!openHarvesterContainerWorkload) {
    return null;
  }

  return PaginationParamFilter.createMultipleFields([
    new PaginationFilterField({
      field:  `metadata.labels."${ CAPI.PROVIDER }"`, // TODO: TEST
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    }),
    new PaginationFilterField({
      field:  `status.provider`, // TODO: TEST
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    }),
  ]);
}

/**
 * Filter out any clusters that are not Kubernetes Clusters
 **/
export function filterOnlyKubernetesClusters(mgmtClusters, store) {
  const openHarvesterContainerWorkload = store.getters['features/get']('harvester-baremetal-container-workload');

  return mgmtClusters?.filter((c) => {
    return openHarvesterContainerWorkload ? true : !isHarvesterCluster(c);
  });
}

export function isHarvesterCluster(mgmtCluster) {
  // Use the provider if it is set otherwise use the label
  const provider = mgmtCluster?.metadata?.labels?.[CAPI.PROVIDER] || mgmtCluster?.status?.provider;

  return provider === VIRTUAL_HARVESTER_PROVIDER;
}

export function isHarvesterSatisfiesVersion(version = '') {
  if (version.startsWith('v1.21.4+rke2r')) {
    const rkeVersion = version.replace(/.+rke2r/i, '');

    return Number(rkeVersion) >= 4;
  } else {
    return semver.satisfies(semver.coerce(version), '>=v1.21.4+rke2r4');
  }
}

export function filterHiddenLocalCluster(mgmtClusters, store) {
  const hideLocalSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
  const value = hideLocalSetting.value || hideLocalSetting.default || 'false';
  const hideLocal = value === 'true';

  if (!hideLocal) {
    return mgmtClusters;
  }

  return mgmtClusters.filter((c) => {
    const target = c.mgmt || c;

    return !target.isLocal;
  });
}

const clusterNameSegments = /([A-Za-z]+|\d+)/g;

/**
 * Shortens an input string based on the number of segments it contains.
 * @param {string} input - The input string to be shortened.
 * @returns {string} - The shortened string.
 * @example smallIdentifier('local') => 'lcl'
 * @example smallIdentifier('word-wide-web') => 'www'
 */
export function abbreviateClusterName(input) {
  if (!input) {
    return '';
  }

  if (input.length <= 3) {
    return input;
  }

  const segments = input.match(clusterNameSegments);

  if (!segments) return ''; // In case no valid segments are found

  let result = '';

  switch (segments.length) {
  case 1: {
    const word = segments[0];

    result = `${ word[0] }${ word[Math.floor(word.length / 2)] }${ word[word.length - 1] }`;
    break;
  }
  case 2: {
    const w1 = `${ segments[0][0] }`;
    const w2 = `${ segments[0].length >= 2 ? segments[0][segments[0].length - 1] : segments[1][0] }`;
    const w3 = `${ segments[1][segments[1].length - 1] }`;

    result = w1 + w2 + w3;
    break;
  }
  default:
    result = segments.slice(0, 2).map((segment) => segment[0]).join('') + segments.slice(-1)[0].slice(-1);
  }

  return result;
}

export function labelForAddon(store, name, configuration = true) {
  const addon = camelToTitle(name.replace(/^(rke|rke2|rancher)-/, ''));
  const fallback = `${ configuration ? '' : 'Add-on: ' }${ addon }`;
  const key = `cluster.addonChart."${ name }"${ configuration ? '.configuration' : '.label' }`;

  return store.getters['i18n/withFallback'](key, null, fallback);
}
