---
layout: chapter
title: Testing complex forms
description: How to test the logic and accessibility of Angular Reactive Forms
---

# Testing complex forms

<aside class="learning-objectives" markdown="1">
Learning objectives

- Filling out and submitting forms in a Component test
- Testing synchronous and asynchronous field validation and error messages
- Testing dynamic form logic
- Using tools to ensure that forms are accessible to everyone
</aside>

Forms are the powerhouses of large web applications. Especially enterprise applications revolve around entering and editing data via forms. Therefore, implementing complex forms is a vital feature of the Angular framework.

We have already learned how to [fill out form fields](../testing-components/#filling-out-forms) when testing the counter Component. In doing so, we developed the `setFieldValue` testing helper.

The simple forms we have dealt with served the purpose of entering one value. We have tested them by filling out the field and submitting the form. Now we will look at a more complex example.

<aside class="margin-note">Sign-up form</aside>

We are introducing and testing a **sign-up form** for a fictional online service.

<div class="book-sources" markdown="1">
- [Sign-up form: Source code](https://github.com/molily/angular-form-testing)
- [Sign-up form: Run the app](https://molily.github.io/angular-form-testing/)
</div>

<button class="load-iframe">
See the sign-up form in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://molily.github.io/angular-form-testing/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

The sign-up form features are:

- Different types of input fields: text, radio buttons, checkboxes, select boxes
- Field validation with synchronous and asynchronous validators
- Accessible form structure, field labels and error messages
- Dynamic relations between fields

The form consists of four sections:

1. The plan selection: “Personal”, “Business” or “Education & Non-profit”
2. The login credentials: username, email and password
3. The billing address
4. Terms of Services and submit button

<aside class="margin-note">Impractical</aside>

Please note that this form is for demonstration purposes only. While it follows best practices regarding validation and accessibility, it is not practical from a design and user experience perspective. Among other things, it is way too complex to get new users onboard.

<aside class="margin-note">Client & server</aside>

In contrast to the other example repositories, this one is split into a `client` and a `server` directory:

- The [`client` directory](https://github.com/molily/angular-form-testing/tree/main/client) contains a standard Angular app created with Angular CLI.
- The [`server` directory](https://github.com/molily/angular-form-testing/tree/main/server) contains a simple Node.js service that simulates the user management and account creation.

Again, the Node.js service is for demonstration purposes only. The service holds the created user accounts in memory and discards them when stopped. Please do not use it in production.

With 12 form controls, the sign-up form is not particularly large. But there are subtle details we are going to explore.

## Sign-up form Component

The form logic lies in the [`SignupFormComponent`](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.ts). The Component depends on the [`SignupService`](https://github.com/molily/angular-form-testing/blob/main/client/src/app/services/signup.service.ts) for communicating with the back-end service.

You might remember that there are two fundamental approaches to forms in Angular: *Template-driven Forms* and *Reactive Forms*.

While both approaches look quite different in practice, they are based on the same underlying concepts: Form groups (`FormGroup` objects) and form controls (`FormControl` objects).

<aside class="margin-note">Reactive Form</aside>

The `SignupFormComponent` is a **Reactive Form** that explictly creates the groups and controls in the Component class. This way, it is easier to specify custom validators and to set up dynamic field relations.

As with other Angular core concepts, this guide assumes you have a basic understanding of Reactive Forms. Please refer to the [official guide on Reactive Forms](https://angular.io/guide/reactive-forms) to brush up your knowledge.

The important bits of the `SignupFormComponent` class are:

```typescript
@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss'],
})
export class SignupFormComponent {
  /* … */
  public form = this.formBuilder.group({
    plan: ['personal', required],
    username: [
      null,
      [required, pattern('[a-zA-Z0-9.]+'), maxLength(50)],
      (control: AbstractControl) =>
        this.validateUsername(control.value),
    ],
    email: [
      null,
      [required, email, maxLength(100)],
      (control: AbstractControl) =>
        this.validateEmail(control.value),
    ],
    password: [
      null,
      required,
      () => this.validatePassword()
    ],
    tos: [null, requiredTrue],
    address: this.formBuilder.group({
      name: [null, required],
      addressLine1: [null],
      addressLine2: [null, required],
      city: [null, required],
      postcode: [null, required],
      region: [null],
      country: [null, required],
    }),
  });
  /* … */
  constructor(
    private signupService: SignupService,
    private formBuilder: FormBuilder) {
    /* … */
  }
  /* … */
}
```

<aside class="margin-note">Form groups and controls</aside>

Using Angular’s [FormBuilder](https://angular.io/guide/reactive-forms#using-the-formbuilder-service-to-generate-controls), we create the `form` property, the topmost form group. Inside, there is another form group for the address-related fields.

The form controls are declared with their initial values and their validators. For example, the password control:

```typescript
password: [
  // The initial value (null means empty)
  null,
  // The synchronous validator
  required,
  // The asynchronous validator
  () => this.validatePassword()
],
```

The [`SignupFormComponent` template](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.html) uses the `formGroup`, `formGroupName` and `formControlName` directives to associate elements with a form group or control, respectively.

The stripped-down form structure with only one control looks like this:

```html
<form [formGroup]="form">
  <fieldset formGroupName="address">
    <label>
      Full name
      <input type="text" formControlName="name" />
    </label>
  </fieldset>
</form>
```

<aside class="margin-note">Form submission</aside>

When the form is filled out correctly and all validations pass, the user is able to submit to the form. It produces an object described by the [`SignupData` interface](https://github.com/molily/angular-form-testing/blob/main/client/src/app/services/signup.service.ts):

```typescript
export interface SignupData {
  plan: Plan;
  username: string;
  email: string;
  password: string;
  tos: true;
  address: {
    name: string;
    addressLine1?: string;
    addressLine2: string;
    city: string;
    postcode: string;
    region?: string;
    country: string;
  };
}
```

`Plan` is a union of strings:

```typescript
export type Plan = 'personal' | 'business' | 'non-profit';
```

The `SignupService`’s `signup` method takes the `SignupData` and sends it to the server. For security reasons, the server validates the data again. But we will focus on the front-end in this guide.

<div class="book-sources" markdown="1">
- [SignupFormComponent: full code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/)
- [Angular documentation: Reactive forms](https://angular.io/guide/reactive-forms)
</div>

## Form validation and errors

<aside class="margin-note">Sync validators</aside>

Several form controls have synchronous validators. `required`, `email`, `maxLength`, `pattern` etc. are built-in, synchronous validators provided by Angular:

```typescript
import { Validators } from '@angular/forms';

const {
  email, maxLength, pattern, required, requiredTrue
} = Validators;
```

These validators take the control value, a string most of the time, and return a `ValidationErrors` object with potential error messages. The validation happens synchronously on the client.

<aside class="margin-note">Async validators</aside>

For the username, the email and the password, there are custom asynchronous validators. They check whether the username and email are available and whether the password is strong enough.

The asynchronous validators use the `SignupService` to talk to the back-end service. These HTTP requests turn the validation asynchronous.

<aside class="margin-note">Error rendering</aside>

When a validator returns any errors, corresponding messages are shown below the form control. This repetitive task is outsourced to another Component.

<aside class="margin-note">invalid && (touched || dirty)</aside>

The [`ControlErrorsComponent`](https://github.com/molily/angular-form-testing/tree/main/client/src/app/components/control-errors) displays the errors when the form control is *invalid* and either *touched* or *dirty*.

- *Touched* means the user has focussed the control but it has lost the focus again (the `blur` event fired).
- *Dirty* means the user has changed the value.

For example, for the `name` control, the interaction between the `input` element and the `ControlErrorsComponent` looks like this:

```html
<label>
  Full name
  <input
    type="text"
    formControlName="name"
    aria-required="true"
    appErrorMessage="name-errors"
  />
</label>
<!-- … -->
<app-control-errors controlName="name" id="name-errors">
  <ng-template let-errors>
    <ng-container *ngIf="errors.required">
      Name must be given.
    </ng-container>
  </ng-template>
</app-control-errors>
```

<aside class="margin-note">ARIA attributes</aside>

The `appErrorMessage` attribute activates the [`ErrorMessageDirective`](https://github.com/molily/angular-form-testing/blob/main/client/src/app/directives/error-message.directive.ts). When the form control is invalid and either touched or dirty, the Directive adds `aria-invalid` and `aria-errormessage` attributes.

`aria-invalid` marks the control as invalid for assistive technologies like screen readers. `aria-errormessage` points to another element that contains the error messages.

<aside class="margin-note">Connect control with errors</aside>

In case of an error, the Directive sets `aria-errormessage` to the id of the corresponding `app-control-errors` element. In the example above, the id is `name-errors`. This way, a screen reader user finds the associated error messages quickly.

The control-specific error messages are still located in `signup-form.component.html`. They are passed to `ControlErrorsComponent` as an `ng-template`. The `ControlErrorsComponent` renders the template dynamically, passing the `errors` object as a variable:

```html
<ng-template let-errors>
  <ng-container *ngIf="errors.required">
    Name must be given.
  </ng-container>
</ng-template>
```

You do not have to understand the details of this particular implementation. The solution in the sign-up form is just one possibility to display errors, avoid repetition and set ARIA attributes for accessibility.

From the user perspective and also from a testing perspective, it does not matter how you implement the rendering of error messages – as long as they are present and accessible.

<aside class="margin-note">Implementation details</aside>

We are going to test the `SignupFormComponent` in conjunction with `ControlErrorsComponent` and `ErrorMessageDirective` in a **black-box integration test**. For this test, the latter two will be irrelevant implementation details.

<div class="book-sources" markdown="1">
- [Angular guide: Validating form input](https://angular.io/guide/form-validation)
- [MDN: Introduction to ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [MDN: aria-invalid](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid)
- [ARIA specification: aria-errormessage](https://www.w3.org/TR/wai-aria-1.1/#aria-errormessage)
- [ErrorMessageDirective: full code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/directives/error-message.directive.ts)
- [ControlErrorsComponent: full code](https://github.com/molily/angular-form-testing/tree/main/client/src/app/components/control-errors)
</div>

## Test plan

What are the important parts of the sign-up form that need to be tested?

1. Form submission
  - [Successful submission](#successful-form-submission)
  - [Do not submit the invalid form](#invalid-form)
  - [Submission failure](#form-submission-failure)
2. [Required fields are marked as such and display error messages](#required-fields)
3. [Asynchronous validation of username, email and password](#asynchronous-validators)
4. [Dynamic field relations](#dynamic-field-relations)
5. [Password type toggle](#password-type-toggle)
6. [Accessibility of the form structure, field labels and error messages](#testing-form-accessibility)

## Test setup

Before writing the individual specs, we need to set up the suite in [`signup-form.component.spec.ts`](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts). Let us start with the testing Module configuration.

```typescript
await TestBed.configureTestingModule({
  imports: [ReactiveFormsModule],
  declarations: [
    SignupFormComponent,
    ControlErrorsComponent,
    ErrorMessageDirective
  ],
  providers: [
    { provide: SignupService, useValue: signupService }
  ],
}).compileComponents();
```

The Component under test contains a Reactive Form. That is why we import the `ReactiveFormsModule`:

```typescript
imports: [ReactiveFormsModule],
```

<aside class="margin-note">Deep rendering</aside>

As described, we are writing an integration test, so we declare the Component and its child components:

```typescript
declarations: [
  SignupFormComponent,
  ControlErrorsComponent,
  ErrorMessageDirective
],
```

<aside class="margin-note">Fake Service</aside>

The `SignupFormComponent` depends on the `SignupService`. We do not want HTTP requests to the back-end when the tests run, so we [replace the Service with a fake instance](../testing-components-depending-on-services/#faking-service-dependencies).

```typescript
providers: [
  { provide: SignupService, useValue: signupService }
],
```

A possible `SignupService` fake looks like this:

```typescript
const signupService:
  Pick<SignupService, keyof SignupService> = {
  isUsernameTaken() {
    return of(false);
  },
  isEmailTaken() {
    return of(false);
  },
  getPasswordStrength() {
    return of(strongPassword);
  },
  signup() {
    return of({ success: true });
  },
};
```

This fake implements the *success case*: the username and email are available, the password is strong enough and the form submission was successful.

Since we are going to test several error cases as well, we need to create `SignupService` fakes dynamically. Also we need Jasmine spies to verify that the Service methods are called correctly.

<aside class="margin-note" markdown="1">
  `createSpyObj`
</aside>

This is a job for Jasmine’s `createSpyObj` (see [Faking Service dependencies](../testing-components-depending-on-services/#faking-service-dependencies)).

```typescript
const signupService = jasmine.createSpyObj<SignupService>(
  'SignupService',
  {
    // Successful responses per default
    isUsernameTaken: of(false),
    isEmailTaken: of(false),
    getPasswordStrength: of(strongPassword),
    signup: of({ success: true }),
  }
);
```

<aside class="margin-note">Setup function</aside>

Together with the testing Module configuration, we put this code into a setup function. To adjust the `SignupService` fake behavior, we allow passing method return values.

```typescript
describe('SignupFormComponent', () => {
  let fixture: ComponentFixture<SignupFormComponent>;
  let signupService: jasmine.SpyObj<SignupService>;

  const setup = async (
    signupServiceReturnValues?:
      jasmine.SpyObjMethodNames<SignupService>,
  ) => {
    signupService = jasmine.createSpyObj<SignupService>(
      'SignupService',
      {
        // Successful responses per default
        isUsernameTaken: of(false),
        isEmailTaken: of(false),
        getPasswordStrength: of(strongPassword),
        signup: of({ success: true }),
        // Overwrite with given return values
        ...signupServiceReturnValues,
      }
    );

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        SignupFormComponent,
        ControlErrorsComponent,
        ErrorMessageDirective
      ],
      providers: [
        { provide: SignupService, useValue: signupService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupFormComponent);
    fixture.detectChanges();
  };

  /* … */
});
```

In all following specs, we are going to call `setup` first. If we simply write `async setup()`, the `SignupService` fake returns successful responses.

We can pass an object with different return values to simulate failure. For example, when testing that the username is taken:

```typescript
await setup({
  // Let the API return that the username is taken
  isUsernameTaken: of(true),
});
```

Such a `setup` function is just one way to create fakes and avoid repetition. You might come up with a different solution that serves the same purpose.

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Successful form submission

The first case we need to test is the successful form submission. If the user fills out all required fields and the validations pass, we expect the Component to call `SignupService`’s `signup` method with the entered form data.

<aside class="margin-note">Test data</aside>

The first step is to define *valid test data* we can fill into the form. We put this in a separate file, [signup-data.spec-helper.ts](https://github.com/molily/angular-form-testing/blob/main/client/src/app/spec-helpers/signup-data.spec-helper.ts):

```typescript
export const username = 'quickBrownFox';
export const password = 'dog lazy the over jumps fox brown quick the';
export const email = 'quick.brown.fox@example.org';
export const name = 'Mr. Fox';
export const addressLine1 = '';
export const addressLine2 = 'Under the Tree 1';
export const city = 'Farmtown';
export const postcode = '123456';
export const region = 'Upper South';
export const country = 'Luggnagg';

export const signupData: SignupData = {
  plan: 'personal',
  username,
  email,
  password,
  address: {
    name, addressLine1, addressLine2,
    city, postcode, region, country
  },
  tos: true,
};
```

In the [signup-form.component.html](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.html) template, all field elements need to be marked with test ids so we can find them and enter the values programmatically.

For example, the username input gets the test id `username`, the email input gets `email` and so on.

Back in `signup-form.component.spec.ts`, we create a new spec that calls the setup function.

```typescript
it('submits the form successfully', async () => {
    await setup();

    /* … */
});
```

<aside class="margin-note">Fill out form</aside>

Next, we fill out all required fields with valid values. Since we need to do that in several upcoming specs, let us create a reusable function.

```typescript
const fillForm = () => {
  setFieldValue(fixture, 'username', username);
  setFieldValue(fixture, 'email', email);
  setFieldValue(fixture, 'password', password);
  setFieldValue(fixture, 'name', name);
  setFieldValue(fixture, 'addressLine1', addressLine1);
  setFieldValue(fixture, 'addressLine2', addressLine2);
  setFieldValue(fixture, 'city', city);
  setFieldValue(fixture, 'postcode', postcode);
  setFieldValue(fixture, 'region', region);
  setFieldValue(fixture, 'country', country);
  checkField(fixture, 'tos', true);
};
```

The `fillForm` function lies in the scope of `describe` so it may access the `fixture` variable. It uses the `setFieldValue` and `checkField` [element testing helpers](../testing-components/#testing-helpers).

In the spec, we call `fillForm`:

```typescript
it('submits the form successfully', async () => {
    await setup();

    fillForm();

    /* … */
});
```

Let us try to submit the form immediately after. The form under test listens for an [`ngSubmit` event](https://angular.io/api/forms/NgForm#listening-for-form-submission) at the `form` element. This boils down to a native `submit` event.

<aside class="margin-note">Submit form</aside>

We find the `form` element by its test id and simulate a `submit` event (see [Triggering event handlers](../testing-components/#triggering-event-handlers)).

Then we expect the `signup` spy to have been called with the entered data.

```typescript
it('submits the form successfully', async () => {
    await setup();

    fillForm();

    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.signup).toHaveBeenCalledWith(signupData);
});
```

If we run this spec, we find that is fails:

```
Expected spy SignupService.signup to have been called with:
  [ Object({ plan: 'personal', … }) ]
but it was never called.
```

The spec fails because the form is still in the *invalid* state even though we have filled out all fields correctly.

<aside class="margin-note">Async validators</aside>

The cause are the **asynchronous validators** for username, email and password. When the user stops typing into these fields, they wait for one second before sending a request to the server.

In production, the HTTP request takes additional time, but our fake `SignupService` returns the response instantly.

<aside class="margin-note">One second debounce</aside>

This technique to reduce the amount of requests is called *debouncing*. For example, typing the username “fox” should send *one* request with “fox”, not *three* subsequent requests with “f”, “fo”, “fox”.

The spec above submits the form immediately after filling out the fields. At this point in time, the asynchronous validators have been called but have not returned a value yet. They are still waiting for the debounce period to pass.

In consequence, the test needs to wait one second for the asynchronous validators. An easy way would be to write an asynchronous test that uses `setTimeout(() => { /* … */}, 1000)`. But this would slow down our specs.

<aside class="margin-note" markdown="1">
  `fakeAsync` and `tick`
</aside>

Instead, we are going to use Angular’s `fakeAsync` and `tick` functions to *simulate* the passage of time. They are a powerful couple to test asynchronous behavior.

`fakeAsync` freezes time. It hooks into the processing of asynchronous tasks created by timers, intervals, Promises and Observables. It prevents these tasks from being executed.

<aside class="margin-note">Simulate passage of time</aside>

Inside the time warp created by `fakeAsync`, we use the `tick` function to simulate the passage of time. The scheduled tasks are executed and we can test their effect.

The specialty of `fakeAsync` and `tick` is that the passage of time is only virtual. Even if one second passes in the simulation, the spec still completes in a few milliseconds.

`fakeAsync` wraps the spec function which is also an `async` function due to the `setup` call. After filling out the form, we simulate the waiting with `tick(1000)`.

```typescript
it('submits the form successfully', fakeAsync(async () => {
  await setup();

  fillForm();

  // Wait for async validators
  tick(1000);

  findEl(fixture, 'form').triggerEventHandler('submit', {});

  expect(signupService.signup).toHaveBeenCalledWith(signupData);
}));
```

This spec passes! Now we should add some expectations to test the details.

First, we expect the asynchronous validators to call the `SignupService` methods with the user input. The methods are `isUsernameTaken`, `isEmailTaken` and `getPasswordStrength`.

```typescript
it('submits the form successfully', fakeAsync(async () => {
  await setup();

  fillForm();

  // Wait for async validators
  tick(1000);

  findEl(fixture, 'form').triggerEventHandler('submit', {});

  expect(signupService.isUsernameTaken).toHaveBeenCalledWith(username);
  expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
  expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
  expect(signupService.signup).toHaveBeenCalledWith(signupData);
}));
```

<aside class="margin-note">Submit button</aside>

Next, we make sure that the submit button is disabled initially. After successful validation, the button is enabled. (The submit button carries the test id `submit`.)

<aside class="margin-note">Status message</aside>

Also, when the form has been submitted successfully, the status message “Sign-up successful!” needs to appear. (The status message carries the test id `status`.)

This brings us to the final spec:

```typescript
it('submits the form successfully', fakeAsync(async () => {
  await setup();

  fillForm();
  fixture.detectChanges();

  expect(findEl(fixture, 'submit').properties.disabled).toBe(true);

  // Wait for async validators
  tick(1000);
  fixture.detectChanges();

  expect(findEl(fixture, 'submit').properties.disabled).toBe(false);

  findEl(fixture, 'form').triggerEventHandler('submit', {});
  fixture.detectChanges();

  expectText(fixture, 'status', 'Sign-up successful!');

  expect(signupService.isUsernameTaken).toHaveBeenCalledWith(username);
  expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
  expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
  expect(signupService.signup).toHaveBeenCalledWith(signupData);
}));
```

Because we are testing DOM changes, we have to call `detectChanges` after each *Act* phase.

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
- [Angular API reference: fakeAsync](https://angular.io/api/core/testing/fakeAsync)
- [Angular API reference: tick](https://angular.io/api/core/testing/tick)
</div>

## Invalid form

Now that we have tested the successful form submission, let us check the handling of an invalid form. What happens if we do not fill out any fields, but submit the form?

We create a new spec for this case:

```typescript
it('does not submit an invalid form', fakeAsync(async () => {
  await setup();

  // Wait for async validators
  tick(1000);

  findEl(fixture, 'form').triggerEventHandler('submit', {});

  expect(signupService.isUsernameTaken).not.toHaveBeenCalled();
  expect(signupService.isEmailTaken).not.toHaveBeenCalled();
  expect(signupService.getPasswordStrength).not.toHaveBeenCalled();
  expect(signupService.signup).not.toHaveBeenCalled();
}));
```

This spec does less than the previous. We wait for a second and submit the form without entering data. Finally, we expect that no `SignupService` method has been called.

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Form submission failure

We have already tested the successful form submission. Now let us test the form submission failure.

<aside class="margin-note">Reasons for failure</aside>

Despite correct input, the submission may fail for several reasons:

- The network is unavailable
- The back-end processed the request but returned an error:
  - The server-side validation failed
  - The request structure is not as expected
  - The server code has bugs, has crashed or is frozen

<aside class="margin-note">Observable</aside>

When the user submits the form, the Component under tests calls the `SignupService`’s `signup` method.

- In the *success case*, the `signup` method returns an Observable that emits the value `{ success: true }` and completes. The form displays a status message “Sign-up successful!”.
- In the *error case*, the Observable fails with an error. The form displays a status message “Sign-up error”.

Let us test the latter case in a new spec. The structure resembles the spec for the successful submission. But we configure the fake `signup` method to return an Observable that fails with an error.

```typescript
import { throwError } from 'rxjs';
```

```typescript
it('handles signup failure', fakeAsync(async () => {
  await setup({
    // Let the API report a failure
    signup: throwError(new Error('Validation failed')),
  });

  /* … */
});
```

We fill out the form, wait for the validators and submit the form.

```typescript
fillForm();

// Wait for async validators
tick(1000);

findEl(fixture, 'form').triggerEventHandler('submit', {});
fixture.detectChanges();
```

<aside class="margin-note">Status message</aside>

Finally, we expect the “Sign-up error” status message to appear. Also, we verify that the relevant `SignupService` methods have been called.

```typescript
expectText(fixture, 'status', 'Sign-up error');

expect(signupService.isUsernameTaken).toHaveBeenCalledWith(username);
expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
expect(signupService.signup).toHaveBeenCalledWith(signupData);
```

The full spec:

```typescript
it('handles signup failure', fakeAsync(async () => {
  await setup({
    // Let the API report a failure
    signup: throwError(new Error('Validation failed')),
  });

  fillForm();

  // Wait for async validators
  tick(1000);

  findEl(fixture, 'form').triggerEventHandler('submit', {});
  fixture.detectChanges();

  expectText(fixture, 'status', 'Sign-up error');

  expect(signupService.isUsernameTaken).toHaveBeenCalledWith(username);
  expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
  expect(signupService.signup).toHaveBeenCalledWith(signupData);
}));
```

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Required fields

A vital form logic is that certain fields are required and that the user interface conveys the fact clearly. Let us write a spec that checks whether required fields as marked as such.

<aside class="margin-note">Requirements</aside>

The requirements are:

- A required field has an `aria-required` attribute.
- A required, invalid field has an `aria-errormessage` attribute. It contains the id of another element.
- This element contains an error message “… must be given”. (The text for the Terms of Services checkbox reads “Please accept the Terms and Services” instead.)

Our spec needs to verify all required fields, so we compile a list of their respective test ids:

```typescript
const requiredFields = [
  'username',
  'email',
  'name',
  'addressLine2',
  'city',
  'postcode',
  'country',
  'tos',
];
```

<aside class="margin-note">invalid && (touched || dirty)</aside>

Before examining the fields, we need to trigger the display of form errors. As described in [Form validation and errors](#form-validation-and-errors), error messages are shown when the field is *invalid* and either *touched* or *dirty*.

Luckily, the empty, but required fields are already invalid. Entering text would make them *dirty* but also *valid*.

<aside class="margin-note">Mark as touched</aside>

So we need to *touch* the fields. If a field is focussed and loses focus again, Angular considers it as *touched*. Under the hood, Angular listens for the `blur` event.

In our spec, we simulate a `blur` event using the `dispatchFakeEvent` testing helper. Let us put the call in a reusable function:

```typescript
const markFieldAsTouched = (element: DebugElement) => {
  dispatchFakeEvent(element.nativeElement, 'blur');
};
```

We can now write the *Arrange* and *Act* phases of the spec:

```typescript
it('marks fields as required', async () => {
  await setup();

  // Mark required fields as touched
  requiredFields.forEach((testId) => {
    markFieldAsTouched(findEl(fixture, testId));
  });
  fixture.detectChanges();

  /* … */
});
```

A `forEach` loop walks through the required field test ids, finds the element and marks the field as touched. We call `detectChanges` afterwards so the error messages appear.

<aside class="margin-note" markdown="1">
  `aria-required`
</aside>

Next, the *Assert* phase. Again we walk through the required fields to examine each one of them. Let us start with the `aria-required` attribute.

```typescript
requiredFields.forEach((testId) => {
  const el = findEl(fixture, testId);

  // Check aria-required attribute
  expect(el.attributes['aria-required']).toBe(
    'true',
    `${testId} must be marked as aria-required`,
  );

  /* … */
});
```

`findEl` returns a `DebugElement` with an `attributes` property. This object contains all attributes set by the template. We expect the attribute `aria-required="true"` to be present.

<aside class="margin-note" markdown="1">
  `aria-errormessage`
</aside>

The next part tests the error message with three steps:

1. Read the `aria-errormessage` attribute. Expect that it is set.
2. Find the element that `aria-errormessage` refers to. Expect that it exists.
3. Read the text content. Expect an error message.

Step 1 looks like this:

```typescript
// Check aria-errormessage attribute
const errormessageId = el.attributes['aria-errormessage'];
if (!errormessageId) {
  throw new Error(`Error message id for ${testId} not present`);
}
```

Normally, we would use a Jasmine expectation like `expect(errormessageId).toBeDefined()`. But `errormessageId` has the type `string | null` whereas we need a `string` in the upcoming commands.

<aside class="margin-note">Type assertions</aside>

We need a TypeScript type assertion that rules out the `null` case and narrows down the type to `string`. If the attribute is absent or empty, we throw an exception. This fails the test with the given error and ensures that `errormessageId` is a string for the rest of the spec.

Step 2 finds the error message element:

```typescript
// Check element with error message
const errormessageEl = document.getElementById(errormessageId);
if (!errormessageEl) {
  throw new Error(`Error message element for ${testId} not found`);
}
```

We use the native DOM method `document.getElementById` to find the element. `errormessageEl` has the type `HTMLElement | null`, so we rule out the `null` case to work with `errormessageEl`.

<aside class="margin-note">Error message</aside>

Finally, we ensure that the element contains an error message, with a special treatment of the Terms and Services message.

```typescript
if (errormessageId === 'tos-errors') {
  expect(errormessageEl.textContent).toContain(
    'Please accept the Terms and Services',
  );
} else {
  expect(errormessageEl.textContent).toContain('must be given');
}
```

The full spec looks like this:

```typescript
it('marks fields as required', async () => {
  await setup();

  // Mark required fields as touched
  requiredFields.forEach((testId) => {
    markFieldAsTouched(findEl(fixture, testId));
  });
  fixture.detectChanges();

  requiredFields.forEach((testId) => {
    const el = findEl(fixture, testId);

    // Check aria-required attribute
    expect(el.attributes['aria-required']).toBe(
      'true',
      `${testId} must be marked as aria-required`,
    );

    // Check aria-errormessage attribute
    const errormessageId = el.attributes['aria-errormessage'];
    if (!errormessageId) {
      throw new Error(
        `Error message id for ${testId} not present`
      );
    }
    // Check element with error message
    const errormessageEl = document.getElementById(errormessageId);
    if (!errormessageEl) {
      throw new Error(
        `Error message element for ${testId} not found`
      );
    }
    if (errormessageId === 'tos-errors') {
      expect(errormessageEl.textContent).toContain(
        'Please accept the Terms and Services',
      );
    } else {
      expect(errormessageEl.textContent).toContain('must be given');
    }
  });
});
```

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Asynchronous validators

The sign-up form features asynchronous validators for username, email and password. They are asynchronous because they wait for a second and make an HTTP request. Under the hood, they are implemented using RxJS Observables.

<aside class="margin-note">Async validation failure</aside>

We have already covered the “happy path” in which the entered username and email are available and the password is strong enough. We need to write three specs for the error cases: Username or email are taken and the password is too weak.

The validators call `SignupService` methods. Per default, the `SignupService` fake returns successful responses.

```typescript
const setup = async (
  signupServiceReturnValues?:
    jasmine.SpyObjMethodNames<SignupService>,
) => {
  signupService = jasmine.createSpyObj<SignupService>(
    'SignupService',
    {
      // Successful responses per default
      isUsernameTaken: of(false),
      isEmailTaken: of(false),
      getPasswordStrength: of(strongPassword),
      signup: of({ success: true }),
      // Overwrite with given return values
      ...signupServiceReturnValues,
    }
  );

  /* … */
};
```

The `setup` function allows us to overwrite the fake behavior. It accepts an object with `SignupService` method return values.

We add three specs that configure the fake accordingly:

```typescript
it('fails if the username is taken', fakeAsync(async () => {
  await setup({
    // Let the API return that the username is taken
    isUsernameTaken: of(true),
  });
  /* … */
}));
```

```typescript
it('fails if the email is taken', fakeAsync(async () => {
  await setup({
    // Let the API return that the email is taken
    isEmailTaken: of(true),
  });
  /* … */
}));
```

```typescript
it('fails if the password is too weak', fakeAsync(async () => {
  await setup({
    // Let the API return that the password is weak
    getPasswordStrength: of(weakPassword),
  });
  /* … */
}));
```

The rest is the same for all three specs. Here is the first spec:

```typescript
it('fails if the username is taken', fakeAsync(async () => {
  await setup({
    // Let the API return that the username is taken
    isUsernameTaken: of(true),
  });

  fillForm();

  // Wait for async validators
  tick(1000);
  fixture.detectChanges();

  expect(findEl(fixture, 'submit').properties.disabled).toBe(true);

  findEl(fixture, 'form').triggerEventHandler('submit', {});

  expect(signupService.isUsernameTaken).toHaveBeenCalledWith(username);
  expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
  expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
  expect(signupService.signup).not.toHaveBeenCalled();
}));
```

We fill out the form, wait for the async validators and try to submit the form.

We expect that the three async validators call the respective `SignupService` methods.

The username validation fails, so we expect that the Component prevents the form submission. The `signup` method must not be called.

As stated above, the two other specs `it('fails if the email is taken', /* … */)` and `it('fails if the password is too weak', /* … */)` look the same apart from the fake setup.

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
- [Angular documentation: Creating asynchronous validators](https://angular.io/guide/form-validation#creating-asynchronous-validators)
</div>

## Dynamic field relations

The sign-up form has a fixed set of fields. But the `addressLine1` field depends on the value of the `plan` field:

- If the selected plan is “Personal”, the field is optional and the label reads “Address line 1”.
- If the selected plan is “Business”, the field is required and the label reads “Company”.
- If the selected plan is “Education & Non-profit”, the field is required and the label reads “Organization”.

The implementation in the Component class looks like this:

```typescript
this.plan.valueChanges.subscribe((plan: Plan) => {
  if (plan !== this.PERSONAL) {
    this.addressLine1.setValidators(required);
  } else {
    this.addressLine1.setValidators(null);
  }
  this.addressLine1.updateValueAndValidity();
});
```

We listen for value changes of the `plan` control. Depending on the selection, we either add the `required` validator to the `addressLine1` control or remove all validators.

Finally, we need to tell Angular to revalidate the field value, now that the validators have changed.

Let us write a spec to ensure that `addressLine1` is required for certain plans.

```typescript
it('requires address line 1 for business and non-profit plans', async () => {
  await setup();

  /* … */
});
```

First, we need inspect the initial state: The “Personal” plan is selected and `addressLine1` is optional.

We do so by looking at attributes of the `addressLine1` field element: The `ng-invalid` class and the `aria-required` attribute must be absent.

```typescript
// Initial state (personal plan)
const addressLine1El = findEl(fixture, 'addressLine1');
expect('ng-invalid' in addressLine1El.classes).toBe(false);
expect('aria-required' in addressLine1El.attributes).toBe(false);
```

From this baseline, let us change the plan from “Personal” to “Business”. We use the `checkField` spec helper to activate the corresponding radio button.

```typescript
// Change plan to business
checkField(fixture, 'plan-business', true);
fixture.detectChanges();
```

To see the effect of the change, we need to tell Angular to update the DOM. Then we expect the `ng-invalid` class and the `aria-required` to be present.

```typescript
expect(addressLine1El.attributes['aria-required']).toBe('true');
expect(addressLine1El.classes['ng-invalid']).toBe(true);
```

We perform the same check for the “Education & Non-profit” plan.

```typescript
// Change plan to non-profit
checkField(fixture, 'plan-non-profit', true);
fixture.detectChanges();

expect(addressLine1El.attributes['aria-required']).toBe('true');
expect(addressLine1El.classes['ng-invalid']).toBe(true);
```

This is it! Here is the full spec:

```typescript
it('requires address line 1 for business and non-profit plans', async () => {
  await setup();

  // Initial state (personal plan)
  const addressLine1El = findEl(fixture, 'addressLine1');
  expect('ng-invalid' in addressLine1El.classes).toBe(false);
  expect('aria-required' in addressLine1El.attributes).toBe(false);

  // Change plan to business
  checkField(fixture, 'plan-business', true);
  fixture.detectChanges();

  expect(addressLine1El.attributes['aria-required']).toBe('true');
  expect(addressLine1El.classes['ng-invalid']).toBe(true);

  // Change plan to non-profit
  checkField(fixture, 'plan-non-profit', true);
  fixture.detectChanges();

  expect(addressLine1El.attributes['aria-required']).toBe('true');
  expect(addressLine1El.classes['ng-invalid']).toBe(true);
});
```

We have already checked the presence of `aria-required` attributes when testing the [required fields](#required-fields). For consistency, we check for `aria-required` in this spec as well.

As a second indicator, we check for the `ng-invalid` class. This class is set by Angular itself on invalid form fields without us having to add it via the template. Note that the mere presence of the class does not imply that the invalid state is conveyed visually.

Alternatively, we could check for the presence of an error message, like we did in the required fields spec.

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Password type toggle

Another small feature of the sign-up form is the password type switcher. This button toggles the visibility of the entered password. Under the hood, it changes the input type from `password` to `text` and vice versa.

The Component class stores the visibility in a boolean property:

```typescript
public showPassword = false;
```

In the template, the input type depends on the property (shortened code):

```html
<input [type]="showPassword ? 'text' : 'password'" />
```

Finally, the button toggles the boolean value (shortened code):

```html
<button
  type="button"
  (click)="showPassword = !showPassword"
>
  {% raw  %}{{ showPassword ? '🔒 Hide password' : '👁️ Show password' }}{% endraw  %}
</button>
```

To test this feature, we create a new spec:

```typescript
it('toggles the password display', async () => {
  await setup();

  /* … */
});
```

Initially, the field has the `password` type so the entered text is obfuscated. Let us test this baseline.

First, we enter a password into the field. This is not strictly necessary but makes the test more realistic and debugging easier. (The password field has the test id `password`.)

```typescript
setFieldValue(fixture, 'password', 'top secret');
```

We find the input element by its test id again to check the `type` attribute.

```typescript
const passwordEl = findEl(fixture, 'password');
expect(passwordEl.attributes.type).toBe('password');
```

Now we click on the toggle button for the first time. We let Angular update the DOM and check the input type again.

```typescript
click(fixture, 'show-password');
fixture.detectChanges();

expect(passwordEl.attributes.type).toBe('text');
```

We expect that the type has changed from `password` to `text`. The password is now visible.

With a second click on the toggle button, the type switches back to `password`.

```typescript
click(fixture, 'show-password');
fixture.detectChanges();

expect(passwordEl.attributes.type).toBe('password');
```

This is the whole spec:

```typescript
it('toggles the password display', async () => {
  await setup();

  setFieldValue(fixture, 'password', 'top secret');
  const passwordEl = findEl(fixture, 'password');
  expect(passwordEl.attributes.type).toBe('password');

  click(fixture, 'show-password');
  fixture.detectChanges();

  expect(passwordEl.attributes.type).toBe('text');

  click(fixture, 'show-password');
  fixture.detectChanges();

  expect(passwordEl.attributes.type).toBe('password');
});
```

<div class="book-sources" markdown="1">
- [SignupFormComponent: test code](https://github.com/molily/angular-form-testing/blob/main/client/src/app/components/signup-form/signup-form.component.spec.ts)
</div>

## Testing form accessibility

Web accessibility means that all people can use a web site, regardless of their physical or mental abilities or web access technologies. It is is part of a greater effort called Inclusive Design, the process of creating information systems that account for people with diverse abilities and needs.

Designing web forms is a usability and accessibility challenge. Web forms often pose a barrier for users with disabilities and users of assistive technologies.

<aside class="margin-note">Accessible form</aside>

The sign-up form has several accessibility features, among others:

- The form is well-structured with heading, `fieldset` and `legend` elements.
- All fields have proper labels, e.g. “Username (required)”.
- Some fields have additional descriptions. The descriptions are linked with `aria-describedby` attributes.
- Required fields are marked with `aria-required="true"`.
- Invalid fields are marked with `aria-invalid="true"`. The error messages are linked with `aria-errormessage` attributes.
- When the form is submitted, the result is communicated using a status message with `role="status"`.
- The structure and styling clearly conveys the current focus as well as the validity state.

<aside class="margin-note">Automated accessibility testing</aside>

There are many more accessibility requirements and best practices that we have not mentioned. Since this guide is not about creating accessible forms primarily, let us explore how to **test accessibility in an automated way**.

We have tested some of the features above in the `SignupFormComponent`’s integration test. Instead of writing more specs for accessibility requirements by hand, let us test the accessibility with a proper tool.

<div class="book-sources" markdown="1">
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
</div>

### pa11y

In this guide, we will look at **pa11y**, a Node.js program that checks the accessibility of a web page.

<aside class="margin-note">Tests in Chrome</aside>

pa11y starts and remotely-controls a Chrome or Chromium browser. The browser navigates to the page under test. pa11y then injects *axe-core* and/or *HTML CodeSniffer*, two accessibility testing engines.

These engines check compliance with the Web Content Accessibility Guidelines (WCAG), the authoritative technical standard for web accessibility.

<aside class="margin-note">CLI vs. CI</aside>

pa11y has two modes of operation: The command line interface (CLI) for checking one web page and the continuous integration (CI) mode for checking multiple web pages.

For quickly testing a single page of your Angular application, use the command line interface. When testing the whole application on a regular basis, use the continuous integration mode.

To use the command line interface, install pa11y as a global npm module:

```
npm install -g pa11y
```

<aside class="margin-note">Test single page</aside>

This installs the global command `pa11y`. To test a page on the local Angular development server, run:

```
pa11y http://localhost:4200/
```

For the sign-up form, pa11y does not report any errors:

```
Welcome to Pa11y

 > Running Pa11y on URL http://localhost:4200/

No issues found!
```

<aside class="margin-note">Error report</aside>

If one of the form fields did not have a proper label, pa11y would complain:

```
 • Error: This textinput element does not have a name available to
   an accessibility API. Valid names are: label element,
   title undefined, aria-label undefined, aria-labelledby undefined.
   ├── WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputText.Name
   ├── html > body > app-root > main > app-signup-form > form > fieldset:nth-child(2) > div:nth-child(2) > p > span > input
   └── <input _ngcontent-srr-c42="" type="text" formcontrolname="username" …

 • Error: This form field should be labelled in some way.
   Use the label element (either with a "for" attribute or
   wrapped around the form field), or "title", "aria-label"
   or "aria-labelledby" attributes as appropriate.
   ├── WCAG2AA.Principle1.Guideline1_3.1_3_1.F68
   ├── html > body > app-root > main > app-signup-form > form > fieldset:nth-child(2) > div:nth-child(2) > p > span > input
   └── <input _ngcontent-srr-c42="" type="text" formcontrolname="username" …
```

Each error message contains the violated WCAG rule, the DOM path to the violating element and its HTML code.

<div class="book-sources" markdown="1">
- [pa11y: Accessibility testing tools](https://pa11y.org/)
- [axe-core: Accessibility engine for automated Web UI testing](https://github.com/dequelabs/axe-core)
- [HTML CodeSniffer: Accessibility auditor](https://github.com/squizlabs/HTML_CodeSniffer)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
</div>

### pa11y-ci

For comprehensive test runs both during development and on a build server, we will set up pa11y in the continuous integration mode.

In your Angular project directory, install the `pa11y-ci` package:

```
npm install pa11y-ci
```

pa11y-ci expects a configuration file named `.pa11yci` in the project directory. Create the file and paste this JSON:

```json
{
  "defaults": {
    "runner": [
      "axe",
      "htmlcs"
    ]
  },
  "urls": [
    "http://localhost:4200"
  ]
}
```

<aside class="margin-note">Test multiple URLs</aside>

This configuration tells pa11y to check the URL http://localhost:4200 and to use both available testing engines, `axe` and `htmlcs`. You can add many URLs to the `urls` array.

We can now run pa11y-ci with:

```
npx pa11y-ci
```

For the sign-up form, we get this output:

```
Running Pa11y on 1 URLs:
> http://localhost:4200 - 0 errors

✔ 1/1 URLs passed
```

<div class="book-sources" markdown="1">
- [pa11y-ci: CI-centric accessibility test runner](https://github.com/pa11y/pa11y-ci)
</div>

### Start server and run pa11y-ci

The configuration above expects that the development server is already running at http://localhost:4200. Both in development and on a build server, it is useful to start the Angular server, run the accessibility tests and then stop the server again.

We can achieve this with another handy Node.js package, `start-server-and-test`.

```
npm install start-server-and-test
```

`start-server-and-test` first runs an npm script that is supposed to start an HTTP server. Then it waits for the server to boot up. Once a given URL is available, it runs another npm script.

In our case, the first script is `start`, an alias for `ng serve`. We need to create the second script to run `pa11y-ci`.

<aside class="margin-note">npm scripts</aside>

We edit package.json, and add two scripts:

```json
{
  "scripts": {
    "a11y": "start-server-and-test start http-get://localhost:4200/ pa11y-ci",
    "pa11y-ci": "pa11y-ci"
  },
}
```

Now, `npm run a11y` starts the Angular development server, then runs pa11y-ci, finally stops the server. The audit result is written to the standard output.

<div class="book-sources" markdown="1">
- [start-server-and-test: Starts server, waits for URL, then runs test command](https://github.com/bahmutov/start-server-and-test)
</div>

## Form accessibility: Summary

pa11y is a powerful set of tools with many options. We have barely touched on its features.

Automated accessibility testing is a valuable addition to unit, integration and end-to-end tests. You should run an accessibility tester like pa11y against the pages of your Angular application. It is especially helpful to ensure the accessibility of complex forms.

Bear in mind that automated testing only points out certain accessibility barriers that can be detected programmatically.

The Web Content Accessibility Guidelines (WCAG) establish – from abstract to specific – *principles*, *guidelines* and *success criteria*. The latter are the practical rules some of which can be checked automatically.

The WCAG success criteria are accompanied by *techniques* for HTML, CSS, JavaScript etc. For JavaScript web applications, techniques like ARIA are especially relevant.

In summary, you need to learn about accessibility and Inclusive Design first, apply the rules while designing and implementing the application. Then check the compliance manually and automatically.

<div class="book-sources" markdown="1">
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [Quick Reference: How to Meet WCAG](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Introduction to ARIA - Accessible Rich Internet Applications](https://webaim.org/techniques/aria/)
- [Web Accessibility Tutorial: Forms](https://www.w3.org/WAI/tutorials/forms/)
</div>

<p id="next-chapter-link"><a href="../testing-components-with-spectator/#testing-components-with-spectator">Testing Components with Spectator</a></p>
