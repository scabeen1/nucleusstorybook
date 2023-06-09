import { addExtraFlags, getStorybookVersion, isCorePackage, NON_CANARY_REGEX } from './upgrade';

describe.each([
  ['│ │ │ ├── @babel/code-frame@7.10.3 deduped', null],
  [
    '│ ├── @storybook/theming@6.0.0-beta.37 extraneous',
    { package: '@storybook/theming', version: '6.0.0-beta.37' },
  ],
  [
    '├─┬ @storybook/preset-create-react-app@3.1.2',
    { package: '@storybook/preset-create-react-app', version: '3.1.2' },
  ],
  ['│ ├─┬ @storybook/node-logger@5.3.19', { package: '@storybook/node-logger', version: '5.3.19' }],
  [
    'npm ERR! peer dep missing: @storybook/react@>=5.2, required by @storybook/preset-create-react-app@3.1.2',
    null,
  ],
])('getStorybookVersion', (input, output) => {
  it(`${input}`, () => {
    expect(getStorybookVersion(input)).toEqual(output);
  });
});

describe.each([
  ['@storybook/react', true],
  ['@storybook/node-logger', true],
  ['@storybook/addon-info', false],
  ['@storybook/something-random', false],
  ['@storybook/preset-create-react-app', true],
  ['@storybook/linter-config', false],
  ['@storybook/design-system', false],
])('isCorePackage', (input, output) => {
  it(`${input}`, () => {
    expect(isCorePackage(input)).toEqual(output);
  });
});

describe('extra flags', () => {
  const extraFlags = {
    'react-scripts@<5': ['--foo'],
  };
  const devDependencies = {};
  it('package matches constraints', () => {
    expect(
      addExtraFlags(extraFlags, [], { dependencies: { 'react-scripts': '4' }, devDependencies })
    ).toEqual(['--foo']);
  });
  it('package prerelease matches constraints', () => {
    expect(
      addExtraFlags(extraFlags, [], {
        dependencies: { 'react-scripts': '4.0.0-alpha.0' },
        devDependencies,
      })
    ).toEqual(['--foo']);
  });
  it('package not matches constraints', () => {
    expect(
      addExtraFlags(extraFlags, [], {
        dependencies: { 'react-scripts': '5.0.0-alpha.0' },
        devDependencies,
      })
    ).toEqual([]);
  });
  it('no package not matches constraints', () => {
    expect(
      addExtraFlags(extraFlags, [], {
        dependencies: {},
        devDependencies,
      })
    ).toEqual([]);
  });
});

// https://github.com/sindresorhus/semver-regex/blob/main/test.js
describe('filter out canary releases', () => {
  it.each([
    ['6.0.0'],
    ['6.0.0-alpha.0'],
    ['6.0.0-foobar.0'],
    ['1.2.3-4'],
    ['^1.2.3-4'],
    ['~1.2.3-4'],
    ['>1.2.3-4'],
    ['>=1.2.3-4'],
  ])('should match %s', (version) => {
    expect(NON_CANARY_REGEX.test(version)).toEqual(true);
  });
  it.each([
    ['yahooo'],
    ['6.0.0-canary.0.0'],
    ['0.7.6--canary.18.9b6563c.0'],
    ['0.7.6--next.18.0'],
    ['0.7.1-next.18.0'],
    ['~0.7.1-next.18.0'],
    ['^0.7.1-next.18.0'],
  ])('should not match %s', (version) => {
    expect(NON_CANARY_REGEX.test(version)).toEqual(false);
  });
});
