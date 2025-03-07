<script>

import { defineComponent } from 'vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { getAllOptionsAfterCurrentVersion, filterOutDeprecatedPatchVersions } from '@shell/utils/cluster';

export default defineComponent({
  name:       'Basics',
  components: {
    LabeledSelect, Checkbox, LabeledInput
  },
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    versions: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    defaultVersion: {
      type:    String,
      default: () => {
        return '';
      }
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    config: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    upgradeStrategy: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    loadingVersions: {
      type:    Boolean,
      default: false
    },
    rules: {
      default: () => ({
        workerConcurrency:       [],
        controlPlaneConcurrency: []
      }),
      type: Object,
    },

  },
  emits: ['kubernetes-version-changed', 'drain-server-nodes-changed', 'server-concurrency-changed',
    'drain-worker-nodes-changed', 'worker-concurrency-changed', 'enable-authorized-endpoint', 'input'],
  data() {
    const store = this.$store;
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const originalVersion = this.config.kubernetesVersion;

    return {
      supportedVersionRange, originalVersion, showDeprecatedPatchVersions: false
    };
  },
  computed: {
    versionOptions() {
      const cur = this.originalVersion;
      let out = getAllOptionsAfterCurrentVersion(this.$store, this.versions, cur, this.defaultVersion);

      if (!this.showDeprecatedPatchVersions) {
        // Normally, we only want to show the most recent patch version
        // for each Kubernetes minor version. However, if the user
        // opts in to showing deprecated versions, we don't filter them.
        out = filterOutDeprecatedPatchVersions(out, cur);
      }
      const existing = out.find((x) => x.value === cur);

      if (existing) {
        existing.disabled = false;
      }

      return out;
    }
  },
});

</script>
<template>
  <div>
    <div class="row row-basics mb-20">
      <div class="col-basics mr-10 span-6">
        <LabeledSelect
          v-model:value="config.kubernetesVersion"
          data-testid="cruimported-kubernetesversion"
          :mode="mode"
          :options="versionOptions"
          label-key="cluster.kubernetesVersion.label"
          option-key="value"
          option-label="label"
          :loading="loadingVersions"
          @update:value="$emit('kubernetes-version-changed', $event)"
        />
      </div>
      <div class="col-basics span-6 mt-15">
        <Checkbox
          v-model:value="showDeprecatedPatchVersions"
          :label="t('cluster.kubernetesVersion.deprecatedPatches')"
          :tooltip="t('cluster.kubernetesVersion.deprecatedPatchWarning')"
          class="patch-version"
        />
      </div>
    </div>
    <h3 v-t="'imported.upgradeStrategy.header'" />
    <div class="col mt-10 mb-10">
      <div class="col mt-5">
        <Checkbox
          :value="upgradeStrategy.drainServerNodes"
          :mode="mode"
          :label="t('imported.drainControlPlaneNodes.label')"
          @update:value="$emit('drain-server-nodes-changed', $event)"
        />
      </div>
      <div class="col mt-5">
        <Checkbox
          :value="upgradeStrategy.drainWorkerNodes"
          :mode="mode"
          :label="t('imported.drainWorkerNodes.label')"
          @update:value="$emit('drain-worker-nodes-changed', $event)"
        />
      </div>
    </div>
    <div class="row row-basics">
      <div class="col-basics mr-10 span-6">
        <LabeledInput
          :value="upgradeStrategy.serverConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.controlPlaneConcurrency.label')"
          :rules="rules.concurrency"
          required
          class="mb-10"
          @update:value="$emit('server-concurrency-changed', $event)"
        />
      </div>
      <div class="col-basics span-6">
        <LabeledInput
          :value="upgradeStrategy.workerConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.workerConcurrency.label')"
          :rules="rules.concurrency"
          required
          class="mb-10"
          @update:value="$emit('worker-concurrency-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
<style>
@media screen and (max-width: 996px) {
    .row-basics {
        flex-direction: column;
    }
    .col-basics {
        width: 100%
    }
  }
</style>
