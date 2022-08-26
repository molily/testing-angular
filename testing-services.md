---
layout: chapter
title: Testing Services
description: How to write automated tests for Angular Services that send HTTP requests
---

# Testing Services

<aside class="learning-objectives" markdown="1">
Learning objectives

- Writing tests for Services with internal state
- Testing Observables returned by Services
- Verifying HTTP requests and payload processing
- Covering HTTP success and error cases
</aside>

In an Angular application, Services are responsible for fetching, storing and processing data. Services are singletons, meaning there is only one instance of a Service during runtime. They are fit for central data storage, HTTP and WebSocket communication as well as data validation.

<aside class="margin-note">Singleton</aside>

The single Service instance is shared among Components and other application parts. Therefore, a Service is used when Components that are not parent and child need to communicate with each other and exchange data.

<aside class="margin-note">Injectable</aside>

“Service” is an umbrella term for any object that serves a specific purpose and is injected as a dependency. Technically, Services have little in common. There are no rules regarding the structure or behavior of a Service.

Typically, Services are classes, but not necessarily. While Modules, Components and Directives are marked with respective decorators – `@Module`, `@Component`, `@Directive` –, Services are marked with the generic `@Injectable`.

<aside class="margin-note">Responsibilities</aside>

So what does a Service do and how do we test it? Services are diverse, but some patterns are widespread.

- Services have public methods that return values.

  In the test, we check whether a method returns correct data.

- Services store data. They hold an internal state. We can get or set the state.

  In the test, we check whether the state is changed correctly. Since the state should be held in private properties, we cannot access the state directly. We test the state change by calling public methods. We should not peek into the [black box](../testing-principles/#black-box-vs-white-box-testing).

- Services interact with dependencies. These are often other Services. For example, a Service might send HTTP requests via Angular’s `HttpClient`.

  In the unit test, we replace the dependency with a fake that returns canned responses.

## Testing a Service with internal state

Let us start with testing the [`CounterService`](https://github.com/9elements/angular-workshop/blob/main/src/app/services/counter.service.ts). By now, you should be familiar with the Service. As a reminder, here is the shape including private members:

```typescript
class CounterService {
  private count: number;
  private subject: BehaviorSubject<number>;
  public getCount(): Observable<number> { /* … */ }
  public increment(): void { /* … */ }
  public decrement(): void { /* … */ }
  public reset(newCount: number): void { /* … */ }
  private notify(): void { /* … */ }
}
```

We need to identify what the Service does, what we need test and how we test it.

<aside class="margin-note">What it does</aside>

- The Service holds an internal state, namely in the private `count` and `subject` properties. We cannot and should not access these properties in the test.
- For reading the state, the Service has the `getCount` method. It does not return a synchronous value, but an RxJS Observable. We will use `getCount` to get the current count and also to subscribe to changes.
- For changing the state, the Service provides the methods `increment`, `decrement` and `reset`. We will call them and check whether the state has changed accordingly.

Let us write the test code! We create a file called `counter.service.spec.ts` and fill it with test suite boilerplate code:

```typescript
describe('CounterService', () => {
  /* … */
});
```

We already know what the Service does and what needs to be tested. So we add specs for all features:

```typescript
describe('CounterService', () => {
  it('returns the count', () => { /* … */ });
  it('increments the count', () => { /* … */ });
  it('decrements the count', () => { /* … */ });
  it('resets the count', () => { /* … */ });
});
```

<aside class="margin-note" markdown="1">
  Instantiate without `TestBed`
</aside>

In the *Arrange* phase, each spec needs to create an instance of `CounterService`. The simplest way to do that is:

```typescript
const counterService = new CounterService();
```

This is fine for simple Services without dependencies. For testing Services with dependencies, we will use the `TestBed` later.

We create the fresh instance in a `beforeEach` block since every spec needs it:

```typescript
describe('CounterService', () => {
  let counterService: CounterService;

  beforeEach(() => {
    counterService = new CounterService();
  });

  it('returns the count', () => { /* … */ });
  it('increments the count', () => { /* … */ });
  it('decrements the count', () => { /* … */ });
  it('resets the count', () => { /* … */ });
});
```

Let us start with writing the spec `it('returns the count', /* … */)`. It tests the `getCount` method that returns an Observable.

<aside class="margin-note">Change variable value</aside>

For testing the Observable, we use the same pattern that we have used for [testing a Component Output](../testing-components/#testing-outputs):

1. We declare a variable `actualCount` that is initially undefined.
2. We subscribe to the Observable. We assign the emitted value to the `actualCount` variable.
3. Finally, outside of the subscriber function, we compare the actual to the expected value.

```typescript
it('returns the count', () => {
  let actualCount: number | undefined;
  counterService.getCount().subscribe((count) => {
    actualCount = count;
  });
  expect(actualCount).toBe(0);
});
```

This works because the Observable is backed by a `BehaviorSubject` that stores the latest value and sends it to new subscribers immediately.

<aside class="margin-note">State change</aside>

The next spec tests the `increment` method. We call the method and verify that the count state has changed.

As mentioned before, we cannot access the private properties for this purpose. Just like in the spec above, we need to use the public `getCount` method to read the count.

```typescript
it('increments the count', () => {
  counterService.increment();

  let actualCount: number | undefined;
  counterService.getCount().subscribe((count) => {
    actualCount = count;
  });
  expect(actualCount).toBe(1);
});
```

<aside class="margin-note">Expect changed value</aside>

The order here is important: First, we call `increment`, then we subscribe to the Observable to read and verify the changed value. Again, the `BehaviorSubject` emits the current value to new subscribers synchronously.

The two remaining specs work almost the same. We just call the respective methods.

```typescript
it('decrements the count', () => {
  counterService.decrement();

  let actualCount: number | undefined;
  counterService.getCount().subscribe((count) => {
    actualCount = count;
  });
  expect(actualCount).toBe(-1);
});

it('resets the count', () => {
  const newCount = 123;
  counterService.reset(newCount);

  let actualCount: number | undefined;
  counterService.getCount().subscribe((count) => {
    actualCount = count;
  });
  expect(actualCount).toBe(newCount);
});
```

<aside class="margin-note">Repeating patterns</aside>

We quickly notice that the specs are highly repetitive and noisy. In every spec’s *Assert* phase, we are using this pattern to inspect the Service state:

```typescript
let actualCount: number | undefined;
counterService.getCount().subscribe((count) => {
  actualCount = count;
});
expect(actualCount).toBe(/* … */);
```

This is a good candidate for a helper function. Let us call it `expectCount`.

```typescript
function expectCount(count: number): void {
  let actualCount: number | undefined;
  counterService.getCount().subscribe((actualCount2) => {
    actualCount = actualCount2;
  });
  expect(actualCount).toBe(count);
}
```

The pattern has one variable bit, the expected count. That is why the helper function has one parameter.

<aside class="margin-note">Unsubscribe</aside>

Now that we have pulled out the code into a central helper function, there is one optimization we should add. The First Rule of RxJS Observables states: “Anyone who subscribes, must unsubscribe as well”.

In `expectCount`, we need to get the current count only once. We do not want to create a long-lasting subscription. We are not interested in future changes.

If we call `expectCount` only once per spec, this is not a huge problem. If we wrote a more complex spec with several `expectCount` calls, we would create pointless subscriptions. This is likely to cause confusion when debugging the subscriber function.

In short, we want to fetch the count and then unsubscribe to reduce unwanted subscriptions.

<aside class="margin-note">Unsubscribe manually</aside>

One possible solution is unsubscribing immediately after subscribing. The `subscribe` method returns a `Subscription` with the useful `unsubscribe` method.

```typescript
function expectCount(count: number): void {
  let actualCount: number | undefined;
  counterService
    .getCount()
    .subscribe((actualCount2) => {
      actualCount = actualCount2;
    })
    .unsubscribe();
  expect(actualCount).toBe(count);
}
```

<aside class="margin-note">RxJS operator</aside>

A more idiomatic way is to use an RxJS operator that completes the Observable after the first value: [`first`](https://rxjs.dev/api/operators/first).

```typescript
import { first } from 'rxjs/operators';

function expectCount(count: number): void {
  let actualCount: number | undefined;
  counterService
    .getCount()
    .pipe(first())
    .subscribe((actualCount2) => {
      actualCount = actualCount2;
    });
  expect(actualCount).toBe(count);
}
```

If you are not familiar with this arcane RxJS magic, do not worry. In the simple `CounterService` test, unsubscribing is not strictly necessary. But it is a good practice that avoids weird errors when testing more complex Services that make use of Observables.

The complete test suite now looks like this:

```typescript
describe('CounterService', () => {
  let counterService: CounterService;

  function expectCount(count: number): void {
    let actualCount: number | undefined;
    counterService
      .getCount()
      .pipe(first())
      .subscribe((actualCount2) => {
        actualCount = actualCount2;
      });
    expect(actualCount).toBe(count);
  }

  beforeEach(() => {
    counterService = new CounterService();
  });

  it('returns the count', () => {
    expectCount(0);
  });

  it('increments the count', () => {
    counterService.increment();
    expectCount(1);
  });

  it('decrements the count', () => {
    counterService.decrement();
    expectCount(-1);
  });

  it('resets the count', () => {
    const newCount = 123;
    counterService.reset(newCount);
    expectCount(newCount);
  });
});
```

<div class="book-sources" markdown="1">
- [CounterService: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/services/counter.service.spec.ts)
</div>

## Testing a Service that sends HTTP requests

Services without dependencies, like `CounterService`, are relatively easy to test. Let us examine a more complex Service with a dependency.

In the [Flickr search](../example-applications/#the-flickr-photo-search), the [FlickrService](https://github.com/9elements/angular-flickr-search/blob/main/src/app/services/flickr.service.ts) is responsible for searching photos via the Flickr API. It makes an HTTP GET request to www.flickr.com. The server responds with JSON. Here is the full code:

```typescript
@Injectable()
export class FlickrService {
  constructor(private http: HttpClient) {}

  public searchPublicPhotos(searchTerm: string): Observable<Photo[]> {
    return this.http
      .get<FlickrAPIResponse>(
        'https://www.flickr.com/services/rest/',
        {
          params: {
            tags: searchTerm,
            method: 'flickr.photos.search',
            format: 'json',
            nojsoncallback: '1',
            tag_mode: 'all',
            media: 'photos',
            per_page: '15',
            extras: 'tags,date_taken,owner_name,url_q,url_m',
            api_key: 'XYZ',
          },
        }
      )
      .pipe(map((response) => response.photos.photo));
  }
}
```

The Service is marked with `@Injectable()` so it takes part in Angular’s Dependency Injection. It depends on Angular’s standard HTTP library, `HttpClient` from the `@angular/common/http` package. Most Angular applications use `HttpClient` to communicate with HTTP APIs.

There are two ways to test the `FlickrService`: an integration test or a unit test.

<aside class="margin-note">Requests against production</aside>

An **integration test** provides the real `HttpClient`. This leads to HTTP requests to the Flickr API when the running the tests. This makes the whole test unreliable.

The network or the web service might be slow or unavailable. Also the Flickr API endpoint returns a different response for each request. It is hard to expect a certain `FlickrService` behavior if the input is unknown.

Requests to third-party production APIs make little sense in a testing environment. If you want to write an integration test for a Service that makes HTTP request, better use a dedicated testing API that returns fixed data. This API can run on the same machine or in the local network.

<aside class="margin-note">Intercept requests</aside>

In the case of `FlickrService`, we better write a **unit test**. Angular has a powerful helper for testing code that depends on `HttpClient`: the [`HttpClientTestingModule`](https://angular.io/guide/http#testing-http-requests).

For testing a Service with dependencies, it is tedious to instantiate the Service with `new`. Instead, we use the `TestBed` to set up a testing Module.

In place of the `HttpClient`, we import the `HttpClientTestingModule`.

```typescript
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [FlickrService],
});
```

The `HttpClientTestingModule` provides a fake implementation of `HttpClient`. It does not actually send out HTTP requests. It merely intercepts them and records them internally.

In the test, we inspect that record of HTTP requests. We respond to pending requests manually with fake data.

<aside class="margin-note">Find, respond, verify</aside>

Our test will perform the following steps:

1. Call the method under test that sends HTTP requests
2. Find pending requests
3. Respond to these requests with fake data
4. Check the result of the method call
5. Verify that all requests have been answered

<div class="book-sources" markdown="1">
- [Angular guide: Communicating with backend services using HTTP ](https://angular.io/guide/http)
- [Angular API reference: HttpClient](https://angular.io/api/common/http/HttpClient)
- [Angular guide: Testing HTTP requests](https://angular.io/guide/http#testing-http-requests)
- [Angular API reference: HttpClientTestingModule](https://angular.io/api/common/http/testing/HttpClientTestingModule)
</div>

### Call the method under test

In the first step, we call the method under test, `searchPublicPhotos`. The search term is simply a fixed string.

```typescript
const searchTerm = 'dragonfly';

describe('FlickrService', () => {
  let flickrService: FlickrService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FlickrService],
    });
    flickrService = TestBed.inject(FlickrService);
  });

  it('searches for public photos', () => {
    flickrService.searchPublicPhotos(searchTerm).subscribe(
      (actualPhotos) => {
        /* … */
      }
    );
    /* … */
  });
});
```

We subscribe to the Observable returned by `searchPublicPhotos` so the (fake) HTTP request is sent. We will investigate the response, `actualPhotos`, later in step four.

### Find pending requests

In the second step, we find the pending request using the [`HttpTestingController`](https://angular.io/api/common/http/testing/HttpTestingController). This class is part of the `HttpClientTestingModule`. We get hold of the instance by calling `TestBed.inject(HttpTestingController)`.

<aside class="margin-note" markdown="1">
  `expectOne`
</aside>

The controller has methods to find requests by different criteria. The simplest is `expectOne`. It finds a request matching the given criteria and expects that there is exactly one match.

In our case, we search for a request with a given URL of the Flickr API.

```typescript
const searchTerm = 'dragonfly';
const expectedUrl = `https://www.flickr.com/services/rest/?tags=${searchTerm}&method=flickr.photos.search&format=json&nojsoncallback=1&tag_mode=all&media=photos&per_page=15&extras=tags,date_taken,owner_name,url_q,url_m&api_key=XYZ`;

describe('FlickrService', () => {
  let flickrService: FlickrService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FlickrService],
    });
    flickrService = TestBed.inject(FlickrService);
    controller = TestBed.inject(HttpTestingController);
  });

  it('searches for public photos', () => {
    flickrService.searchPublicPhotos(searchTerm).subscribe(
      (actualPhotos) => {
        /* … */
      }
    );

    const request = controller.expectOne(expectedUrl);
    /* … */
  });
});
```

`expectOne` returns the found request, that is an instance of `TestRequest`. If there is no pending request that matches the URL, `expectOne` throws an exception, failing the spec.

<div class="book-sources" markdown="1">
- [Angular API reference: HttpTestingController](https://angular.io/api/common/http/testing/HttpTestingController)
- [Angular API reference: TestRequest](https://angular.io/api/common/http/testing/TestRequest)
</div>

### Respond with fake data

Now that we have the pending request at hand, we respond to it with an object that mimics the original API response. The Flickr API returns a complex object with an array of photos objects deep within. In the `FlickrService` test, we only care about the payload, the photos array.

The Flickr search repository contains [fake photo objects](https://github.com/9elements/angular-flickr-search/blob/main/src/app/spec-helpers/photo.spec-helper.ts) that are used throughout the tests. For the `FlickrService` test, we import the `photos` array with two fake photo objects.

We use the request’s `flush` method to respond with fake data. This simulates a successful “200 OK” server response.

```typescript
request.flush({ photos: { photo: photos } });
```

### Check the result of the method call

The spec has proven that `searchPublicPhotos` makes a request to the expected URL. It still needs to prove that the method passes through the desired part of the API response. In particular, it needs to prove that the Observable emits the `photos` array.

We have already subscribed to the Observable:

```typescript
flickrService.searchPublicPhotos(searchTerm).subscribe(
  (actualPhotos) => {
    /* … */
  }
);
```

We expect that the Observable emits a photos array that equals to the one from the API response:

```typescript
flickrService.searchPublicPhotos(searchTerm).subscribe(
  (actualPhotos) => {
    expect(actualPhotos).toEqual(photos);
  }
);
```

This leads to a problem that is known from [testing Outputs](../testing-components/#testing-outputs): If the code under test is broken, the Observable never emits. The `next` callback with `expect` will not be called. Despite the defect, Jasmine thinks that all is fine.

<aside class="margin-note">Expect changed value</aside>

There are several ways to solve this problem. We have opted for a variable that is `undefined` initially and is assigned a value.

```typescript
let actualPhotos: Photo[] | undefined;
flickrService.searchPublicPhotos(searchTerm).subscribe(
  (otherPhotos) => {
    actualPhotos = otherPhotos;
  }
);

const request = controller.expectOne(expectedUrl);
// Answer the request so the Observable emits a value.
request.flush({ photos: { photo: photos } });

// Now verify emitted valued.
expect(actualPhotos).toEqual(photos);
```

The `expect` call is located outside of the `next` callback function to ensure it is definitely called. If the Observable emits no value or a wrong value, the spec fails.

### Verify that all requests have been answered

In the last step, we ensure that there are no pending requests left. We expect the method under test to make *one* request to a specific URL. We have found the request with `expectOne` and have answered it with `flush`.

Finally, we call:

```typescript
controller.verify();
```

This fails the test if there are any outstanding requests.

`verify` guarantees that the code under test is not making excess requests. But it also guarantees that your spec checks all requests, for example by inspecting their URLs.

Putting the parts together, the full test suite:

```typescript
const searchTerm = 'dragonfly';
const expectedUrl = `https://www.flickr.com/services/rest/?tags=${searchTerm}&method=flickr.photos.search&format=json&nojsoncallback=1&tag_mode=all&media=photos&per_page=15&extras=tags,date_taken,owner_name,url_q,url_m&api_key=XYZ`;

describe('FlickrService', () => {
  let flickrService: FlickrService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FlickrService],
    });
    flickrService = TestBed.inject(FlickrService);
    controller = TestBed.inject(HttpTestingController);
  });

  it('searches for public photos', () => {
    let actualPhotos: Photo[] | undefined;
    flickrService.searchPublicPhotos(searchTerm).subscribe(
      (otherPhotos) => {
        actualPhotos = otherPhotos;
      }
    );

    const request = controller.expectOne(expectedUrl);
    request.flush({ photos: { photo: photos } });
    controller.verify();

    expect(actualPhotos).toEqual(photos);
  });
});
```

<div class="book-sources" markdown="1">
- [FlickrService: test code](https://github.com/9elements/angular-flickr-search/blob/main/src/app/services/flickr.service.spec.ts)
- [Photo spec helper](https://github.com/9elements/angular-flickr-search/blob/main/src/app/spec-helpers/photo.spec-helper.ts)
</div>

### Testing the error case

Are we done with testing `searchPublicPhotos`? We have tested the success case in which the server returns a `200 OK`. But we have not tested the error case yet!

<aside class="margin-note">Unhappy path</aside>

`searchPublicPhotos` passes through the error from `HttpClient`. If the Observable returned by `this.http.get` fails with an error, the Observable returned by `searchPublicPhotos` fails with the same error.

Whether there is custom error handling in the Service or not, the *unhappy path* should be tested.

Let us simulate a “500 Internal Server Error”. Instead of responding to the request with `flush`, we let it fail by calling `error`.

```typescript
const status = 500;
const statusText = 'Internal Server Error';
const errorEvent = new ErrorEvent('API error');
/* … */
const request = controller.expectOne(expectedUrl);
request.error(
  errorEvent,
  { status, statusText }
);
```

The `TestRequest`’s `error` method expects an `ErrorEvent`, and an optional options object.

[`ErrorEvent`](https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent) is a special type of `Error`. For testing purposes, we create an instance using `new ErrorEvent('…')`. The constructor parameter is a string message that describes the error case.

The second parameter, the options object, allows us to set the HTTP `status` (like `500`), the `statusText` (like `'Internal Server Error'`) and response headers. In the example above, we set `status` and `statusText`.

<aside class="margin-note">Expect Observable error</aside>

Now we check that the returned Observable behaves correctly. It must not emit a next value and must not complete. It must fail with an error.

We achieve that by subscribing to `next`, `error` and `complete` events:

```typescript
flickrService.searchPublicPhotos(searchTerm).subscribe(
  () => {
    /* next handler must not be called! */
  },
  (error) => {
    /*
    error handler must be called!
    Also, we need to inspect the error.
    */
  },
  () => {
    /* complete handler must not be called! */
  },
);
```

<aside class="margin-note" markdown="1">
  `fail`
</aside>

When the `next` or `complete` handlers are called, the spec must fail immediately. There is a handy global Jasmine function for this purpose: `fail`.

For inspecting the error, we use the same pattern as above, saving the error in a variable in the outer scope.

```typescript
let actualError: HttpErrorResponse | undefined;

flickrService.searchPublicPhotos(searchTerm).subscribe(
  () => {
    fail('next handler must not be called');
  },
  (error) => {
    actualError = error;
  },
  () => {
    fail('complete handler must not be called');
  },
);
```

After answering the request with a server error, we check that the error is passed through. The `error` handler receives an `HttpErrorResponse` object that reflects the `ErrorEvent` as well as the status information.

```typescript
if (!actualError) {
  throw new Error('Error needs to be defined');
}
expect(actualError.error).toBe(errorEvent);
expect(actualError.status).toBe(status);
expect(actualError.statusText).toBe(statusText);
```

<aside class="margin-note">Type guard</aside>

Since `actualError` is defined as `HttpErrorResponse | undefined`, we need to rule out the `undefined` case first before accessing the properties.

`expect(actualError).toBeDefined()` would accomplish that. But the TypeScript compiler does not know that this rules out the `undefined` case. So we need to throw an exception manually.

This is the full spec for the error case:

```typescript
it('passes through search errors', () => {
  const status = 500;
  const statusText = 'Server error';
  const errorEvent = new ErrorEvent('API error');

  let actualError: HttpErrorResponse | undefined;

  flickrService.searchPublicPhotos(searchTerm).subscribe(
    () => {
      fail('next handler must not be called');
    },
    (error) => {
      actualError = error;
    },
    () => {
      fail('complete handler must not be called');
    },
  );

  controller.expectOne(expectedUrl).error(
    errorEvent,
    { status, statusText }
  );

  if (!actualError) {
    throw new Error('Error needs to be defined');
  }
  expect(actualError.error).toBe(errorEvent);
  expect(actualError.status).toBe(status);
  expect(actualError.statusText).toBe(statusText);
});
```

This example is deliberately verbose. It shows you how to test all details. It fails fast and provides helpful error messages.

This approach is recommended for Service methods that have a dedicated error handling. For example, a Service might distinguish between successful responses (like “200 OK”), client errors (like “404 Not Found”) and server errors (like “500 Server error”).

<div class="book-sources" markdown="1">
- [FlickrService: implementation and test](https://github.com/9elements/angular-flickr-search/blob/main/src/app/services/)
- [Angular API reference: HttpErrorResponse](https://angular.io/api/common/http/HttpErrorResponse)
- [MDN reference: ErrorEvent](https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent)
</div>

### Alternatives for finding pending requests

We have used `controller.expectOne` to find a request that matches the expected URL. Sometimes it is necessary to specify more criteria, like the method (`GET`, `POST`, etc.), headers or the request body.

`expectOne` has several signatures. We have used the simplest, a string that is interpreted as URL:

```typescript
controller.expectOne('https://www.example.org')
```

To search for a request with a given method and url, pass an object with these properties:

```typescript
controller.expectOne({
  method: 'GET',
  url: 'https://www.example.org'
})
```

If you need to find one request by looking at its details, you can pass a function:

```typescript
controller.expectOne(
  (requestCandidate) =>
    requestCandidate.method === 'GET' &&
    requestCandidate.url === 'https://www.example.org' &&
    requestCandidate.headers.get('Accept') === 'application/json',
);
```

This predicate function is called for each request, decides whether the candidate matches and returns a boolean.

This lets you sift through all requests programmatically and check all criteria. The candidate is an [HttpRequest](https://angular.io/api/common/http/HttpRequest) instance with properties like `method`, `url`, `headers`, `body`, `params`, etc.

There are two possible approaches: Either you use `expectOne` with many criteria, like in the predicate example. If some request detail does not match, `expectOne` throws an exception and fails the test.

Or you use `expectOne` with few criteria, passing `{ method: '…', url: '…' }`. To check the request details, you can still use Jasmine expectations.

`expectOne` returns a `TestRequest` instance. This object only has methods to answer the request, but no direct information about the request. Use the `request` property to access the underlying `HttpRequest`.

```typescript
// Get the TestRequest.
const request = controller.expectOne({
  method: 'GET',
  url: 'https://www.example.org'
});
// Get the underlying HttpRequest. Yes, this is confusing.
const httpRequest = request.request;
expect(httpRequest.headers.get('Accept')).toBe('application/json');
request.flush({ success: true });
```

This is equivalent to the predicate example above, but gives a more specific error message if the header is incorrect.

<aside class="margin-note" markdown="1">
  `match`
</aside>

In addition to `expectOne`, there is the `match` method for finding multiple requests that match certain criteria. It returns an array of requests. If there are no matches, the array is empty, but the spec does not fail. Hence, you need to add Jasmine expectations to check the array and the requests therein.

Assume there is a `CommentService` with a method `postTwoComments`. The code under test makes two requests to the same URL, but with a different body.

```typescript
@Injectable()
class CommentService() {
  constructor(private http: HttpClient) {}
  public postTwoComments(firstComment: string, secondComment: string) {
    return combineLatest([
      this.http.post('/comments/new', { comment: firstComment }),
      this.http.post('/comments/new', { comment: secondComment }),
    ]);
  }
}
```

The spec could contain:

```typescript
const firstComment = 'First comment!';
const secondComment = 'Second comment!';
commentService
  .postTwoComments(firstComment, secondComment)
  .subscribe();

const requests = controller.match({
  method: 'POST',
  url: '/comments/new',
});
expect(requests.length).toBe(2);
expect(requests[0].request.body).toEqual({ comment: firstComment });
expect(requests[1].request.body).toEqual({ comment: secondComment });
requests[0].flush({ success: true });
requests[1].flush({ success: true });
```

We verify the number of requests and also the body of each request. If these checks pass, we answer each request.

<div class="book-sources" markdown="1">
- [Angular API reference: HttpRequest](https://angular.io/api/common/http/HttpRequest)
- [Angular API reference: TestRequest](https://angular.io/api/common/http/testing/TestRequest)
</div>

## Testing Services: Summary

All in all, testing Services is easier than testing other Angular application parts. Most Services have a clear purpose and a well-defined public API.

If the Service under test depends on another Service, a unit test needs to the fake the dependency. This is probably the hardest part, but takes the same effort as faking Services that are Component dependencies.

<aside class="margin-note">Predefined testing modules</aside>

Angular ships with crucial Services that are commonly used in your own Services. Since Angular intends to be testable, Angular also offers tools to replace them with fakes.

We have used the `HttpClientTestingModule` for testing a Service that depends on `HttpClient`. To name another example, there is the [`RouterTestingModule`](https://angular.io/api/router/testing/RouterTestingModule) for testing Services that depend on `Router` and `Location`.

<p id="next-chapter-link"><a href="../testing-pipes/#testing-pipes">Testing Pipes</a></p>
