---
layout: chapter
title: Testing principles
description: Why do we test? How to test? What makes a good test?
---

# Testing principles

<aside class="learning-objectives" markdown="1">
Learning objectives

- The goals of testing and how to achieve them
- Establishing regular testing practice in your team
- Classify tests by their proximity to the code
- Classify tests by their knowledge of code internals
</aside>

There is a gap between practical introductions – how to test a feature – and fundamental discussions on the core concepts – what does testing achieve, which types of tests are beneficial, etc. Before we dive into the tutorial, we need to reflect on a few basics about testing.

## What makes a good test

When writing tests, you need to keep the goals of testing in mind. You need to judge whether a test is valuable with regard to these goals.

Automated testing has several technical, economical and organizational benefits. Let us pick a few that are useful to judge a test:

1. **Testing saves time and money.** Testing tries to nip software problems in the bud. Tests prevent bugs before they cause real damage, when they are still manageable and under control.

   Of course, quality assurance takes time and costs money itself. But it takes less time and is cheaper than letting bugs slip through into the software release.

   When a faulty application ships to the customer, when users run into a bug, when data is lost or corrupted, your whole business might be at stake. After an incident, it is expensive to analyze and fix the bug in order to regain the user’s trust.

   <aside class="margin-note">Cost-effective</aside>

   **A valuable test is cost-effective.** The test prevents bugs that could ultimately render the application unusable. The test is cheap to write compared to the potential damage it prevents.

2. **Testing formalizes and documents the requirements.** A test suite is a formal, human- and machine-readable description of how the code should behave. It helps the original developers to understand the requirements they have to implement. It helps fellow developers to understand the challenges they had to deal with.

   <aside class="margin-note">Descriptive</aside>

   **A valuable test clearly describes how the implementation code should behave.** The test uses a proper language to talk to developers and convey the requirements. The test lists known cases the implementation has to deal with.

3. **Testing ensures that the code implements the requirements and does not exhibit bugs.** Testing taps every part of the code in order to find flaws.

   <aside class="margin-note">Success and error cases</aside>

   **A valuable test covers the important scenarios** – both correct and incorrect input, expected cases as well as exceptional cases.

4. **Testing makes change safe by preventing regressions.** Tests not only verify that the current implementation meets the requirements. They also verify that the code still works as expected after changes. With proper automated tests in place, accidentally breakage is less likely. Implementing new features and code refactoring is safer.

   <aside class="margin-note">Prevent breakage</aside>

   **A valuable test fails when essential code is changed or deleted.** Design the test to fail if dependent behavior is changed. It should still pass if unrelated code is changed.

## What testing can achieve

Automated testing is a tool with a specific purpose. A basic concept is that testing helps to build an application that functions according to its requirements. That is true, but there are certain subtleties.

The [International Software Testing Qualifications Board (ISTQB)](https://www.istqb.org) came up with **Seven Testing Principles** that shed light on what testing can achieve and what not. Without discussing every principle, let us consider the main ideas.

<aside class="margin-note">Discover bugs</aside>

The purpose of a test is to **discover bugs**. If the test fails, it proves the presence of a bug (or the test is set up incorrectly). If the test passes, it proves that *this particular test setup* did not trigger a bug. It does not prove that the code is correct and free of bugs.

<aside class="margin-note">Test high-risk cases</aside>

So should you write automated tests for all possible cases to ensure correctness? No, say the ISTQB principles: “**Exhaustive testing is impossible**”. It is neither technically feasible nor worthwhile to write tests for all possible inputs and conditions. Instead, you should *assess the risks* of a certain case and write tests for high-risk cases first.

Even if it was viable to cover all cases, it would give you a false sense of security. No software is without errors, and a fully tested software may still be a usability nightmare that does not satisfy its users.

<aside class="margin-note">Adapt testing approach</aside>

Another core idea is that **testing depends on its context** and that it needs to be adapted again and again to provide meaning. The specific context in this guide are single-page web applications written in JavaScript, made with Angular. Such applications need specific testing methods and tools we will get to know.

Once you have learned and applied these tools, you should not stop. A fixed tool chain will only discover certain types of bugs. You need to try different approaches to find new classes of bugs. Likewise, an existing test suite needs to be updated regularly so that it still finds regressions.

<div class="book-sources" markdown="1">
- [International Software Testing Qualifications Board: Certified Tester Foundation Level Syllabus, Version 2018 V3.1, Page 16: Seven Testing Principles](https://www.istqb.org/downloads/category/2-foundation-level-documents.html)
</div>

## Tailoring your testing approach

There is not one correct approach to testing. In fact there are several competing schools of thoughts and methodologies. Learn from other’s experience, but develop a testing approach that suits your application, your team, your project or business.

<aside class="margin-note">Examine your application</aside>

Before you start setting up tests, you should examine the current situation of your application:

- What are the **critical features**? For example, logging in, searching for a record and editing a form.
- What are the frequently reported **technical problems and obstacles**? For example, your application may lack error handling or cross-browser compatibility.
- What are the **technical requirements**? For example, your application needs to consume structured data from a given back-end API. In turn, it needs to expose certain URL routes.

<aside class="margin-note">Development process</aside>

This technical assessment is as important as an inquiry of your development team:

- What is the overall **attitude on testing**? For example, some developers value testing while others find it ineffective to avoid bugs.
- What is the current **testing practice**? For example, developers sometimes write tests, but not as a daily routine.
- What is the **experience on writing tests**? For example, some developers have written tests for several environments, while others understand the basic concepts but have not yet gotten into practice.
- What are the **obstacles** that impede a good testing routine? For example, developers have not been trained on the testing tools.
- Are tests **well-integrated** into your development workflow? For example, a continuous integration server automatically runs the test suite on every change set.

Once you have answered these questions, you should set up a testing goal and implement steps to achieve it.

<aside class="margin-note">Return on investment</aside>

A good start is to think economically. What is the return on investment of writing a test? Pick the low-hanging fruits. Find business-critical features and make sure they are covered by tests. Write tests that require little effort but cover large parts of the code.

<aside class="margin-note">Normalize testing</aside>

Simultaneously, integrate testing into your team’s workflow:

- Make sure everyone shares the same basic expertise.
- Offer formal training workshops and pair experienced programmers with team members less familiar with testing.
- Appoint maintainers and contact persons for test quality and testing infrastructure.
- Hire dedicated software testers, if applicable.

Writing automated tests should be **easy and fun** for your team members. Remove any obstacles that make testing difficult or inefficient.

## The right amount of testing

A fierce debate revolves around the right amount of testing. Too little testing is a problem: Features are not properly specified, bugs go unnoticed, regressions happen. But too much testing consumes development time, yields no additional profit and slows down development in the long run.

So we need to reach a sweet spot. If your testing practice deteriorates from this spot, you run into problems. If you add more tests, you observe little benefit.

<aside class="margin-note">Meaningful tests</aside>

Tests differ in their value and quality. Some tests are more meaningful than others. If they fail, your application is actually unusable. This means **the quality of tests is more important than their quantity**.

A common metric of testing is **code coverage**. It counts the lines in your code that are called by your tests. It tells you which parts of your code are executed at all.

This metric on testing is **useful but also deeply flawed** because the value of a test cannot be quantified automatically. Code coverage tells you whether a piece of code was called, regardless of its importance.

<aside class="margin-note">Find uncovered code</aside>

The coverage report may point to important behavior that is not yet covered by tests, but should be. It does not tell whether the existing tests are meaningful and make the right expectations. You can merely infer that the code does not throw exceptions under test conditions.

It is controversial whether one should strive for 100% code coverage. While it is feasible to cover 100% of certain business-critical code, it requires immense efforts to cover all parts of an application written in Angular and TypeScript.

<aside class="margin-note">Cover main features</aside>

If you write tests for the main features of your app from a user’s perspective, you can achieve a code coverage of 60-70%. Every extra percent gain takes more and more time and bears weird and twisted tests that do not reflect the actual usage of your application.

We are going to discuss the [practical use of code coverage tools](../measuring-code-coverage/#measuring-code-coverage) later.

<div class="book-sources" markdown="1">
- [Angular guide: Code Coverage](https://angular.io/guide/testing-code-coverage)
</div>

## Levels of testing

We can distinguish automated tests by their perspective and proximity to the code.

### End-to-end tests

<aside class="margin-note">Simulate real usage</aside>

Some tests have a *high-level, bird’s-eye view* on the application. They simulate a user interacting with the application: Navigating to an address, reading text, clicking on a link or button, filling out a form, moving the mouse or typing on the keyboard. These tests make expectations about what the user sees and reads in the browser.

From the user’s perspective, it does not matter that your application is implemented in Angular. Technical details like the inner structure of your code are not relevant. There is no distinction between front-end and back-end, between parts of your code. The full experience is tested.

<aside class="margin-note">End-to-end tests</aside>

These tests are called **end-to-end (E2E) tests** since they integrate all parts of the application from one end (the user) to the other end (the darkest corners of the back-end). End-to-end tests also form the automated part of **acceptance tests** since they tell whether the application works for the user.

### Unit tests

Other tests have a *low-level, worm’s-eye view* on the application. They pick a small piece of code and put it through its paces. From this perspective, implementation details matter. The developer needs to set up an appropriate testing environment to trigger all relevant cases.

<aside class="margin-note">Isolate one piece</aside>

The shortsighted worm only sees what is directly in front. This perspective tries to cut off the ties of the code under test with its dependencies. It tries to *isolate* the code in order to examine it.

<aside class="margin-note">Unit tests</aside>

These tests are called **unit tests**. A unit is a small piece of code that is reasonable to test.

### Integration tests

<aside class="margin-note">Cohesive groups</aside>

Between these two extreme perspectives, there are tests that operate on specific parts of the code, but test *cohesive groups*. They prescind from implementation details and try to take the user’s perspective.

<aside class="margin-note">Integration tests</aside>

These tests are called **integration tests** since they test how well the parts *integrate* into the group. For example, all parts of one feature may be tested together. An integration test proves that the parts work together properly.

## Distribution of testing efforts

All levels of testing are necessary and valuable. Different types of tests need to be combined to create a thorough test suite.

But how should we divide our attention? On which level should we spend most of the time? Should we focus on end-to-end tests since they mimic how the user interacts with the application? Again, this is a controversial issue among testing experts.

<aside class="margin-note">Speed</aside>

What is indisputable is that high-level tests like end-to-end tests are expensive and slow, while lower-level tests like integration and unit tests are cheaper and faster.

<aside class="margin-note">Reliability</aside>

Because of their inherent complexity, end-to-end tests tend to be unreliable. They often fail even though the software is without fault. Sometimes they fail for no apparent reason. When you run the same tests again, they suddenly pass. Even if the test correctly fails, it is hard to find the root cause of the problem. You need to wander through the full stack to locate the bug.

<aside class="margin-note">Setup costs</aside>

End-to-end tests use a real browser and run against the full software stack. Therefore the testing setup is immense. You need to deploy front-end, back-end, databases, caches, etc. to testing machines and then have machines to run the end-to-end tests.

In comparison, integration tests are simpler and unit tests even more so. Since they have less moving parts and fewer dependencies, they run faster and the results are reproducible. The setup is relatively simple. Integration and unit tests typically run on one machine against a build of the code under test.

<aside class="margin-note">Cost vs. benefit</aside>

The crucial question for dividing your testing efforts is: Which tests yield the most return on investment? How much work is it to maintain a test in relation to its benefit?

In theory, the benefit of end-to-end tests is the highest, since they indicate whether the application works for the user. In practice, they are unreliable, imprecise and hard to debug. The business value of integration and unit tests is estimated higher.

<aside class="margin-note">Distribution</aside>

For this reason, some experts argue you should write few end-to-end test, a fair amount of integration tests and many unit tests. If this distribution is visualized, it looks like a pyramid:

<p>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" style="display: block; margin: auto; width: 100%; max-width: 25rem">
  <path d="M 250 10 L 490 340 H 10 Z" stroke="gray" stroke-width="2" fill="#d0d0d0" />
  <text x="250" y="65" style="font-size: 20px; text-anchor: middle; dominant-baseline: middle">
    <tspan>End</tspan>
    <tspan x="250" dy="30">to</tspan>
    <tspan x="250" dy="30">end</tspan>
  </text>
  <path d="M 152 145 H 349" stroke="gray" stroke-width="2" />
  <text x="250" y="200" style="font-size: 25px; text-anchor: middle; dominant-baseline: middle">Integration</text>
  <line x1="79" y1="245" x2="421" y2="245" stroke="gray" stroke-width="2" />
  <text x="250" y="295" style="font-size: 30px; text-anchor: middle; dominant-baseline: middle">Unit</text>
</svg>
</p>

These proportions are known as the **Testing Pyramid**. They are widely recognized in software testing across domains, platforms and programming languages.

However, this common distribution also drew criticism. In particular, experts disagree on the value of unit tests.

<aside class="margin-note">Design guide</aside>

On the one hand, unit tests are precise and cheap. They are ideal to specify all tiny details of a shared module. They help developers to design small, composable modules that “do one thing and do it well”. This level of testing forces developers to reconsider how the module interacts with other modules.

<aside class="margin-note">Confidence</aside>

On the other hand, unit tests are too low-level to check whether a certain feature works for the user. They give you little confidence that your application works. In addition, unit tests might increase the cost of every code change.

Unit tests run the risk of mirroring or even duplicating implementation details. These details change frequently because of new requirements elsewhere or during internal refactoring. If you change a line of code somewhere, some distant unit test suddenly fails.

This makes sense if you have touched shared types or shared logic, but it may just be a false alarm. You have to fix this failing test for technical reasons, not because something broke.

<aside class="margin-note">Middle ground</aside>

Integration tests provide a better trade-off. These mid-level tests prescind from implementation details, cover a group of code units and provide more confidence. They are less likely to fail if you refactor code inside of the group.

That is why some experts deem integration tests more valuable and recommend that you spend most of your testing efforts on this level.

In Angular, the difference between unit and integration tests is sometimes subtle. A unit test typically focusses on a single Angular Component, Directive, Service, Pipe, etc. Dependencies are replaced with fakes. An integration test spans one Component together with its children and possibly connected Services as well. It is also possible to write a test that integrates all parts of an Angular Module.

<div class="wide-table-wrapper">
<table class="wide-table">
<caption>Comparison of software testing levels</caption>
<tr>
<th scope="row">Level</th>
<th scope="col">End-to-End</th>
<th scope="col">Inte&#xAD;gration</th>
<th scope="col">Unit</th>
</tr>
<tr>
<th scope="row">Coverage</th>
<td>full</td>
<td>large</td>
<td>small</td>
</tr>
<tr>
<th scope="row">Performance</th>
<td>slow</td>
<td>fast</td>
<td>fastest</td>
</tr>
<tr>
<th scope="row">Reliability</th>
<td>least reliable</td>
<td>reliable</td>
<td>most reliable</td>
</tr>
<tr>
<th scope="row">Isolate Failures</th>
<td>hard</td>
<td>fair</td>
<td>easy</td>
</tr>
<tr>
<th scope="row">Simulate the Real User</th>
<td>yes</td>
<td>no</td>
<td>no</td>
</tr>
</table>
</div>

<p><small>(Table adapted from a <a href="https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html">Google Testing Blog article</a> by Mike Wacker.)</small></p>

<div class="book-sources" markdown="1">
- [Martin Fowler: Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Google Testing Blog: Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Kent C. Dodds: Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
</div>

## Black box vs. white box testing

Once you have identified a piece of code you would like to test, you have to decide how to test it properly. One important distinction is whether a test treats the implementation as a closed, unlit box – a **black box** – or an open, lit box – a **white box**. In this metaphor, the code under test is a machine in a box with holes for inputs and outputs.

<aside class="margin-note">Outside</aside>

**Black box testing** does not assume anything about the internal structure. It puts certain values into the box and expects certain output values. The test talks to the publicly exposed, documented API. The inner state and workings are not examined.

<p>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 450" style="display: block; margin: auto; width: 100%; max-width: 15rem">
  <text x="200" y="30" fill="currentColor" transform="rotate(15, 200, 30)" style="font-size: 30px; text-anchor: middle; dominant-baseline: middle">Input</text>
  <path d="
  M 0 100
  h 150
  l -50 -50
  h 200
  l -50 50
  h 150
  v 250
  h -150
  l 50 50
  h -200
  l 50 -50
  h -150
  Z"
  fill="#444"
  stroke="#888"
  />
  <text x="200" y="225" fill="white" style="font-size: 40px; text-anchor: middle; dominant-baseline: middle; text-shadow: 0 1px 2px black">Black box</text>
  <text x="200" y="427" fill="currentColor" transform="rotate(-15, 200, 427)" style="font-size: 30px; text-anchor: middle; dominant-baseline: middle">Output</text>
</svg>
</p>

<aside class="margin-note">Inside</aside>

**White box testing** opens the box, sheds light on the internals and takes measurements by reaching into the box. For example, a white box test may call methods that are not part of the public API, but still technically tangible. Then it checks the internal state and expects that it has changed accordingly.

<aside class="margin-note">Irrelevant internals</aside>

While both approaches have their value, this guide recommends to **write black box tests whenever possible**. You should check what the code does for the user and for other parts of the code. For this purpose, it is not relevant how the code looks internally. Tests that make assumptions about internals are likely to break in the future when the implementation slightly changes.

<aside class="margin-note">Relevant behavior</aside>

More importantly, white box tests run the risk of forgetting to check the real output. They reach into the box, spin some wheel, flip some switch and check a particular state. They just assume the output without actually checking it. So they fail to cover important code behavior.

<aside class="margin-note">Public API</aside>

For an Angular Component, Directive, Service, Pipe, etc., a black box test passes a certain input and expects a proper output or measures side effects. The test only calls methods that are marked with `public` in the TypeScript code. Internal methods should be marked with `private`.

<p id="next-chapter-link"><a href="../example-applications/#example-applications">Example applications</a></p>
