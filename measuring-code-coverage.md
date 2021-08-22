---
layout: chapter
title: Measuring code coverage
description: How to measure test coverage of Angular applications
---

# Measuring code coverage

<aside class="learning-objectives" markdown="1">
Learning objectives

- Understanding the code coverage metric
- Generating and inspecting a code coverage report
- Finding code that is not yet covered by automated tests
- Enforcing code coverage thresholds and improving code coverage
</aside>

Code coverage, also called test coverage, tells you which parts of your code are executed by running the unit and integration tests. Code coverage is typically expressed as percent values, for example, 79% statements, 53% branches, 74% functions, 78% lines.

Statements are, broadly speaking, control structures like `if` and `for` as well as expressions separated by semicolon. Branches refers to the two branches of `if (…) {…} else {…}` and `… ? … : …` conditions. Functions and lines are self-explanatory.

## Coverage report

In Angular’s Karma and Jasmine setup, [Istanbul](https://istanbul.js.org/) is used for measuring test coverage. Istanbul rewrites the code under test to record whether a statement, branch, function and line was called. Then it produces a comprehensive test report.

To activate Istanbul when running the tests, add the `--code-coverage` parameter:

```
ng test --code-coverage
```

After the tests have completed, Istanbul saves the report in the `coverage` directory located in the Angular project directory.

The report is a bunch of HTML files you can open with a browser. Start by opening `coverage/index.html` in the browser of your choice.

The report for the Flickr search example looks like this:

<a href="/assets/img/code-coverage-flickr-search.png">
  <img src="/assets/img/code-coverage-flickr-search.png" alt="Code coverage report" class="image-max-full" loading="lazy">
</a>

Istanbul creates an HTML page for every directory and every file. By following the links, you can descend to reports for the individual files.

For example, the coverage report for [photo-item.component.ts](https://github.com/9elements/angular-flickr-search/blob/main/src/app/components/photo-item/photo-item.component.ts) of the Flickr search:

<a href="/assets/img/code-coverage-photo-item.png">
  <img src="/assets/img/code-coverage-photo-item.png" alt="Code coverage report for photo-item.component.ts. All statements, functions and lines are covered. There is one condition with two branches, one of which is not covered." class="image-max-full" loading="lazy">
</a>

The report renders the source code annotated with the information how many times a line was called. In the example above, the code is fully covered except for an irrelevant `else` branch, marked with an “E”.

The spec `it('focusses a photo on click', () => {…})` clicks on the photo item to test whether the `focusPhoto` Output emits. Let us disable the spec on purpose to see the impact.

<a href="/assets/img/code-coverage-photo-item-uncovered.png">
  <img src="/assets/img/code-coverage-photo-item-uncovered.png" alt="Code coverage report for photo-item.component.ts. The method handleClick is not called by the test." class="image-max-full" loading="lazy">
</a>

You can tell from the coverage report above that the `handleClick` method is never called. A key Component behavior is untested.

## How to use the coverage report

Now that we know how to generate the report, what should we do with it?

In the chapter [The right amount of testing](../testing-principles/#the-right-amount-of-testing), we have identified code coverage as a useful, but flawed metric. As a quantitative measure, code coverage cannot assess the quality of your tests.

Software testing is not a competition. We should not try to reach a particular score just for the sake of it. For what purpose are we measuring code coverage then?

<aside class="margin-note">Find uncovered code</aside>

The coverage report is a valuable tool you should use while writing tests. It *reveals code behavior that is not yet tested*. The report not only guides your testing, it also deepens your understanding of how your tests work.

Whatever your current coverage score is, use the reporting to monitor and improve your testing practice. As described in [Tailoring your testing approach](../testing-principles/#tailoring-your-testing-approach), testing should be part of the development routine. New features should include tests, bug fixes should include a test as proof and to prevent regressions.

<aside class="margin-note">Improve coverage</aside>

Writing new code and changing existing code should not lower the coverage score, but gradually increase it. This means if your existing tests cover 75% lines of code, new code needs to be at least 75% covered. Otherwise the score slowly deteriorates.

It is common practice to run the unit and integration tests in a continuous integration environment and measure the code coverage. To enforce a certain coverage score and to prevent decline, you can configure **thresholds** in the [Karma configuration](../angular-testing-principles/#configuring-karma-and-jasmine).

In `karma.conf.js`, you can add global thresholds for statements, branches, functions and lines.

```
coverageReporter: {
  /* … */
  check: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
},
```

In the configuration above, all values are set to 75%. If the coverage drops below that number, the test execution fails even if all specs succeeded.

<aside class="margin-note">Raise the bar</aside>

When new code is added to the project with a test coverage better than average, you can raise the thresholds slowly but steadily – for example, from `75` to `75.1`, `75.2`, `75.3` and so on. Soon these small improvements add up.

Test coverage should not be a pointless competition that puts developers under pressure and shames those that do not meet an arbitrary mark. Measuring coverage is a tool you should use for your benefit. Keep in mind that writing meaningful, spot-on tests does not necessarily increase the coverage score.

For beginners and experts alike, the coverage report helps to set up, debug and improve their tests. For experienced developers, the score helps to keep up a steady testing practice.

<div class="book-sources" markdown="1">
- [karma-coverage Configuration](https://github.com/karma-runner/karma-coverage/blob/master/docs/configuration.md)
</div>

<p id="next-chapter-link"><a href="../end-to-end-testing/#end-to-end-testing">End-to-end testing</a></p>
