---
layout: chapter
title: Testing Modules
description: Automated smoke tests for Angular Modules
---

# Testing Modules

<aside class="learning-objectives" markdown="1">
Learning objectives

- Deciding whether and how to test Angular Modules
- Writing smoke tests to catch Module errors early
</aside>

Modules are central parts of Angular applications. Often they contain important setup code. Yet they are hard to test since there is no typical logic, only sophisticated configuration.

<aside class="margin-note">Only metadata</aside>

Angular Modules are classes, but most of the time, the class itself is empty. The essence lies in the metadata set with `@NgModule({ … })`.

We could sneak into the metadata and check whether certain Services are provided, whether third-party Modules are imported and whether Components are exported.

But such a test would simply **mirror the implementation**. Code duplication does not give you more confidence, it only increases the cost of change.

Should we write tests for Modules at all? If there is a reference error in the Module, the compilation step (`ng build`) fails before the automated tests scrutinize the build. “Failing fast” is good from a software quality perspective.

<aside class="margin-note">Smoke test</aside>

There are certain Module errors that only surface during runtime. These can be caught with a *smoke test*. Given this Module:

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExampleComponent } from './example.component';

@NgModule({
  declarations: [ExampleComponent],
  imports: [CommonModule],
})
export class FeatureModule {}
```

We write this smoke test:

```typescript
import { TestBed } from '@angular/core/testing';
import { FeatureModule } from './example.module';

describe('FeatureModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeatureModule],
    });
  });

  it('initializes', () => {
    const module = TestBed.inject(FeatureModule);
    expect(module).toBeTruthy();
  });
});
```

The integration test uses the `TestBed` to import the Module under test. It verifies that no error occurs when importing the Module.

<p id="next-chapter-link"><a href="../measuring-code-coverage/#measuring-code-coverage">Measuring code coverage</a></p>
