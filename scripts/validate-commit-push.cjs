#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const commitMessage = process.argv.slice(2).join(' ').trim();

function run(command, args, options = {}) {
  const label = [command, ...args].join(' ');
  console.log(`\n$ ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function output(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    process.exit(result.status || 1);
  }
  return result.stdout.trim();
}

if (!commitMessage) {
  console.error('Usage: npm run ship -- "commit message"');
  process.exit(1);
}

const branch = output('git', ['branch', '--show-current']);
if (!branch) {
  console.error('Cannot determine current branch.');
  process.exit(1);
}

const beforeStatus = output('git', ['status', '--short', '--untracked-files=all']);
if (!beforeStatus) {
  console.log('No changes to commit.');
  process.exit(0);
}

console.log(`Current branch: ${branch}`);
console.log('\nChanges before validation:\n' + beforeStatus);

run('git', ['add', '-A']);

const staged = output('git', ['diff', '--cached', '--name-only']);
if (!staged) {
  console.log('Validation passed, but no staged changes remain.');
  process.exit(0);
}

console.log('\nStaged files:\n' + staged);

run('npm', ['run', 'astro', '--', 'sync']);
run('npm', ['run', 'validate:seo:source']);
run('npm', ['run', 'validate:images:staged']);

if (process.env.FULL_BUILD === '1') {
  // Full builds for this repo may require a larger V8 heap. The build is kept
  // opt-in because astro-compress can wait in its final hook on large runs.
  run('npm', ['run', 'build'], {
    timeout: 10 * 60 * 1000,
    env: {
      ...process.env,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=8192'].filter(Boolean).join(' '),
    },
  });
}

run('git', ['commit', '-m', commitMessage]);
run('git', ['push', '-u', 'origin', branch]);

console.log('\nValidated, committed, and pushed.');
