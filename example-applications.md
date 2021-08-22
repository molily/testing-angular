---
layout: chapter
title: Angular example applications with tests
description: Fully-tested Angular projects used as example in this book
---

# Example applications

<aside class="learning-objectives" markdown="1">
Learning objectives

- Example Angular applications used in the book
- Features demonstrated by the examples
</aside>

In this guide, we will explore the different aspects of testing Angular applications by looking at two examples.

## The counter Component

<div class="book-sources" markdown="1">
- [Counter Component: Source code](https://github.com/9elements/angular-workshop)
- [Counter Component: Run the app](https://9elements.github.io/angular-workshop/)
</div>

<button class="load-iframe">
See the counter Component app in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-workshop/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

The counter is a reusable Component that increments, decrements and resets a number using buttons and input fields.

<aside class="margin-note">Challenging to test</aside>

For intermediate Angular developers, this might look trivial. That is intentional. This guide assumes that you know Angular basics and that you are able to build a counter Component, but struggle testing the ins and outs.

The goals of this example are:

- **Simplicity**: Quickly grasp what the Component is supposed to do.
- **Cover core Angular features**: Reusable Components with state, Inputs, Outputs, templates, event handling.
- **Scalability**: Starting point for more complex application architectures.

<aside class="margin-note">State management</aside>

The counter comes in three flavors with different state management solutions:

1. An independent, self-sufficient counter Component that holds its own state.
2. A counter that is connected to a Service using dependency injection. It shares its state with other counters and changes it by calling Service methods.
3. A counter that is connected to a central NgRx Store. (NgRx is a popular state management library.) The counter changes the state indirectly by dispatching NgRx Actions.

While the counter seems easy to implement, it already offers valuable challenges from a testing perspective.

## The Flickr photo search

<div class="book-sources" markdown="1">
- [Flickr photo search: Source code](https://github.com/9elements/angular-flickr-search)
- [Flickr photo search: Run the app](https://9elements.github.io/angular-flickr-search/)
</div>

<button class="load-iframe">
See the Flickr photo search in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-flickr-search/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

This application allows you to search for photos on Flickr, the popular photo hosting site.

<aside class="margin-note">Typical application flow</aside>

First, you enter a search term and start the search. The Flickr search API is queried. Second, the search results with thumbnails are rendered. Third, you can select a search result to see the photo details.

This application is straight-forward and relatively simple to implement. Still it raises important questions:

- **App structure**: How to split responsibilities into Components and how to model dependencies.
- **API communication**: How to fetch data by making HTTP requests and update the user interface.
- **State management**: Where to hold the state, how to pass it down in the Component tree, how to alter it.

The Flickr search comes in two flavors using different state management solutions:

<aside class="margin-note">State management</aside>

1. The state is managed in the top-level Component, passed down in the Component tree and changed using Outputs.
2. The state is managed by an NgRx Store. Components are connected to the store to pull state and dispatch Actions. The state is changed in a Reducer. The side effects of an Action are handled by NgRx Effects.

Once you are able to write automatic tests for this example application, you will be able to test most features of a typical Angular application.

<p id="next-chapter-link"><a href="../angular-testing-principles/#angular-testing-principles">Angular testing principles</a></p>
