# Jest

* [Documentation](https://jestjs.io/docs/configuration#coveragedirectory-string)
* [Guide to Understanding the Jest Coverage Report](https://aakanksha-02.medium.com/understanding-the-jest-coverage-report-a-complete-guide-57d950130fdc#:~:text=Types%20of%20Coverage%20in%20Jest&text=Statements%20Coverage%3A%20This%20shows%20the,statements%20coverage%20would%20be%2080%25.)
* [What's Test Driven Development](https://www.youtube.com/watch?v=Jv2uxzhPFl4): TDD is to write tests first before
  implementing actual code. It goes from **red** (write failing tests), to **green** (write some code to get it passed
  the tests), and to **refactor**, which is to refine the code based on the test results. TDD works great if the project
  has clear requirements and goals.

## Jest configs (`jest.config.ts`)

### Coverage

Coverage report indicates how well the code is tested. If enabled, Jest will generate a coverage report under
`./src/coverage` (set by `coverageDirectory`)

Check [this](https://aakanksha-02.medium.com/understanding-the-jest-coverage-report-a-complete-guide-57d950130fdc#:~:text=Types%20of%20Coverage%20in%20Jest&text=Statements%20Coverage%3A%20This%20shows%20the,statements%20coverage%20would%20be%2080%25.)
on understanding the jest coverage report.

* `collectCoverage`: Whether the test collects coverage information. Enable it for more clarity on the effectiveness of
  the written tests.
* `coverageProvider`: Indicates which provider should be used to instrument code for coverage. `babel`'
  s [istanbul](https://istanbul.js.org) is the default coverage provider. It generally more predictable and stable
  coverage results than `v8`, however, it can be slower and more memory-intensive, especially for large files.
* `coverageThreshold`: This will be used to configure minimum threshold enforcement for coverage results. If the
  threshold aren't met, the test will fail. It can be specified as `global`, and as a directory or a file path.
    * We should always aim for 100% coverage while it may be hard to reach irl

### Test Environment

* `testEnvironment`: The test environment that will be used for testing. The default environment is `node`. Another option is `jsdom` which creates a browser-like environment, and it's suitable for testing web apps.
* `testEnvironmentOption`

### Miscellaneous
* `moduleFileExtensions`: An array of file extensions your modules use. It is recommended to place the extensions most commonly used in the project on the left.
* `transform`: A transformer is needed if the code contains syntax not supported by Node out of the box (such as JSX, TypeScript, etc.). Default transformer is `babel-jest` and it would transform any `.js(x)` and `ts(x)` file.
* `verbose`: Enable it to have each test reported during the run.
* `watchman`: Enable it to watch files and record when they change. Jest to re-run only the tests that might be affected by those changes.