import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Glob, YAML } from 'bun';

const cli = ['eas-cli@25.1.1'];
const platforms = ['android', 'ios'];
const emptyState = () => ({ version: 1, android: null, ios: null });
const workflow = YAML.parse(
  readFileSync(new URL('../.eas/workflows/beta.yml', import.meta.url), 'utf8'),
);
const platformEnv = {
  android: {
    buildId: process.env.BETA_ANDROID_BUILD_ID,
    submitted: process.env.BETA_ANDROID_SUBMITTED,
    required: process.env.BETA_ANDROID_REQUIRED,
  },
  ios: {
    buildId: process.env.BETA_IOS_BUILD_ID,
    submitted: process.env.BETA_IOS_SUBMITTED,
    required: process.env.BETA_IOS_REQUIRED,
  },
};

function run(command, args, env = process.env) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env,
  }).trim();
}

function easJson(...args) {
  if (!process.env.BETA_EXPO_TOKEN) {
    throw new Error(
      'Set the BETA_EXPO_TOKEN secret in the production EAS environment.',
    );
  }
  return JSON.parse(
    run('bunx', [...cli, ...args, '--json'], {
      ...process.env,
      EXPO_TOKEN: process.env.BETA_EXPO_TOKEN,
    }),
  );
}

function output(name, value) {
  if (value === '') return;
  run('set-output', [
    name,
    typeof value === 'string' ? value : JSON.stringify(value),
  ]);
}

export function appInputsChanged(paths) {
  const patterns = workflow.on.push.paths;
  const includes = patterns.filter((pattern) => !pattern.startsWith('!'));
  const excludes = patterns
    .filter((pattern) => pattern.startsWith('!'))
    .map((pattern) => pattern.slice(1));
  return paths.some(
    (path) =>
      includes.some((pattern) => new Glob(pattern).match(path)) &&
      !excludes.some((pattern) => new Glob(pattern).match(path)),
  );
}

function isAncestor(commit, target) {
  const result = spawnSync('git', [
    'merge-base',
    '--is-ancestor',
    commit,
    target,
  ]);
  if (result.status !== 0 && result.status !== 1) {
    throw new Error('Could not verify release ancestry.');
  }
  return result.status === 0;
}

export function assertCurrentMaster() {
  if (process.env.APP_VARIANT) {
    throw new Error('Beta delivery requires the main app variant.');
  }
  const shallow =
    run('git', ['rev-parse', '--is-shallow-repository']) === 'true';
  run('git', [
    'fetch',
    ...(shallow ? ['--unshallow'] : []),
    'origin',
    'master',
  ]);
  if (!isAncestor('HEAD', 'FETCH_HEAD')) {
    throw new Error('Beta delivery requires a commit on master.');
  }
  const changed = run('git', ['diff', '--name-only', 'HEAD', 'FETCH_HEAD']);
  if (appInputsChanged(changed.split('\n'))) {
    throw new Error(
      'A newer app revision is on master; this delivery is superseded.',
    );
  }
}

function sameRuntime(delivery, fingerprints) {
  return (
    delivery?.fingerprints.android === fingerprints.android &&
    delivery?.fingerprints.ios === fingerprints.ios
  );
}

export function planDelivery({
  state,
  fingerprints,
  candidates,
  forceNative = false,
  event = 'push',
  now = Date.now(),
}) {
  const refresh =
    state.ios !== null &&
    now - Date.parse(state.ios.createdAt) >= 75 * 24 * 60 * 60 * 1000;
  const force = forceNative || refresh;
  const compatible = platforms.every((platform) =>
    sameRuntime(state[platform], fingerprints),
  );
  const mode =
    force || !compatible ? 'native' : event === 'schedule' ? 'none' : 'ota';
  const plan = { mode, state, fingerprints };

  for (const platform of platforms) {
    const delivered = state[platform];
    const candidate = candidates[platform];
    const alreadyDelivered = !force && sameRuntime(delivered, fingerprints);
    const reuse =
      !force &&
      candidate?.reusable &&
      (delivered === null ||
        Date.parse(candidate.createdAt) > Date.parse(delivered.createdAt));
    plan[`${platform}_build_id`] = alreadyDelivered
      ? delivered.buildId
      : reuse
        ? candidate.id
        : '';
    plan[`${platform}_submit`] = mode === 'native' && !alreadyDelivered;
  }
  return plan;
}

export function readDeliveryState(runDetails) {
  const record = runDetails.jobs.find(
    (job) => job.key === 'record_delivery' && job.status === 'SUCCESS',
  );
  if (!record) return null;
  const state = JSON.parse(record.outputs.state);
  if (state.version !== 1)
    throw new Error('Unsupported beta delivery checkpoint.');
  return state;
}

function loadState() {
  const runs = easJson(
    'workflow:runs',
    '--workflow',
    'beta.yml',
    '--limit',
    '100',
  ).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  for (const previous of runs) {
    if (previous.id === process.env.BETA_WORKFLOW_ID) continue;
    const state = readDeliveryState(
      easJson('workflow:view', previous.id, '--non-interactive'),
    );
    if (state) return state;
  }
  if (runs.length >= 100 && process.env.BETA_FORCE_NATIVE !== 'true') {
    throw new Error(
      'No recent delivery checkpoint; rerun with force_native to rebuild.',
    );
  }
  return emptyState();
}

function checkBuild(build, platform, fingerprint) {
  if (
    build.status !== 'FINISHED' ||
    build.platform.toLowerCase() !== platform ||
    build.buildProfile !== 'beta' ||
    build.distribution !== 'STORE' ||
    build.appIdentifier !== 'com.rogeonee.lapsha' ||
    build.updateChannel?.name !== 'beta' ||
    build.fingerprint?.hash !== fingerprint ||
    build.runtime?.version !== fingerprint
  ) {
    throw new Error('Build does not match the beta app and runtime.');
  }
}

export function recordDelivery(state, fingerprints, builds) {
  const next = { ...state };
  for (const platform of platforms) {
    const build = builds[platform];
    if (!build) continue;
    checkBuild(build, platform, fingerprints[platform]);
    next[platform] = {
      buildId: build.id,
      createdAt: build.createdAt,
      fingerprints,
    };
  }
  return next;
}

export function readyToPublish(mode, required, builds) {
  return (
    mode === 'ota' ||
    (mode === 'native' &&
      platforms.every(
        (platform) => required[platform] === false || Boolean(builds[platform]),
      ))
  );
}

export function assertBetaChannel(channels) {
  const beta = channels.find((channel) => channel.name === 'beta');
  if (
    channels.some(
      (channel) =>
        channel.name !== 'beta' &&
        channel.updateBranches.some((branch) => branch.name === 'beta'),
    )
  ) {
    throw new Error('The beta update branch is shared with another channel.');
  }
  if (!beta) return;
  const mapping = JSON.parse(beta.branchMapping);
  const branch = beta.updateBranches.find((entry) => entry.name === 'beta');
  if (
    beta.isPaused ||
    !branch ||
    mapping.data.length !== 1 ||
    mapping.data[0].branchId !== branch.id ||
    mapping.data[0].branchMappingLogic !== 'true'
  ) {
    throw new Error(
      'The beta channel must be active and point only to the beta branch.',
    );
  }
}

function createPlan() {
  assertCurrentMaster();
  const fingerprints = JSON.parse(process.env.BETA_FINGERPRINTS);
  const state = loadState();
  const forceNative = process.env.BETA_FORCE_NATIVE === 'true';
  const candidates = {};
  for (const platform of platforms) {
    const id = platformEnv[platform].buildId;
    if (!id || forceNative) continue;
    const build = easJson('build:view', id);
    checkBuild(build, platform, fingerprints[platform]);
    const sourceExists =
      build.gitCommitHash &&
      spawnSync('git', ['cat-file', '-e', `${build.gitCommitHash}^{commit}`], {
        stdio: 'ignore',
      }).status === 0;
    candidates[platform] = {
      ...build,
      reusable: sourceExists && isAncestor(build.gitCommitHash, 'HEAD'),
    };
  }
  const plan = planDelivery({
    state,
    fingerprints,
    candidates,
    forceNative,
    event: process.env.BETA_EVENT,
  });
  for (const [name, value] of Object.entries(plan)) output(name, value);
  console.log(`Beta delivery: ${plan.mode}`);
}

function saveDelivery() {
  const builds = {};
  for (const platform of platforms) {
    if (platformEnv[platform].submitted === 'true') {
      builds[platform] = easJson('build:view', platformEnv[platform].buildId);
    }
  }
  output(
    'state',
    recordDelivery(
      JSON.parse(process.env.BETA_STATE),
      JSON.parse(process.env.BETA_FINGERPRINTS),
      builds,
    ),
  );
  output(
    'publish',
    readyToPublish(
      process.env.BETA_MODE,
      {
        android: platformEnv.android.required !== 'false',
        ios: platformEnv.ios.required !== 'false',
      },
      builds,
    ),
  );
}

function publishUpdate() {
  assertCurrentMaster();
  assertBetaChannel(easJson('channel:list', '--limit', '25').currentPage);
  const sha = run('git', ['rev-parse', 'HEAD']);
  const result = easJson(
    'update',
    '--channel',
    'beta',
    '--environment',
    'production',
    '--platform',
    'all',
    '--upload-source-maps',
    '--message',
    `master ${sha}`,
    '--non-interactive',
  );
  output('updates', result);
}

if (import.meta.main) {
  switch (process.argv[2]) {
    case 'guard':
      assertCurrentMaster();
      break;
    case 'plan':
      createPlan();
      break;
    case 'record':
      saveDelivery();
      break;
    case 'publish':
      publishUpdate();
      break;
    default:
      throw new Error('Expected guard, plan, record, or publish.');
  }
}
