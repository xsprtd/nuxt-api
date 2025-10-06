# Nuxt API Authentication and Http Client

This module is based on [@qirolab/nuxt-sanctum-authentication](https://github.com/qirolab/nuxt-sanctum-authentication) with some modifications and additional functionality added.

---

## Installation

To install the module run

```shell
npm i @xsprtd/nuxt-api
```
---

## Configuration

Within your `nuxt.config.ts` add the `@xsprtd/nuxt-api` to the list of modules and the `nuxtApi` entry and overwrite the relevant options.

```javascript
export default defineNuxtConfig({
  modules: [
    //...
    '@xsprtd/nuxt-api'
    //...
  ],
  //...
  nuxtApi: {
    apiBaseURL: process.env.API_BASE_URL,
    authMode: 'cookie',
    userStateKey: 'user',
    headers: {},
    token: {
      storageKey: 'AUTH_TOKEN',
      storageType: 'cookie',
      responseKey: 'token',
    },
    fetchOptions: {
      retryAttempts: false,
    },
    csrf: {
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      intendedEnabled: false,
      login: '/login',
      postLogin: '/dashboard',
      postLogout: '/login',
    },
    middlewareNames: {
      auth: 'auth',
      guest: 'guest',
    },
    errorMessages: {
      default: 'Whoops - something went wrong',
      csrf: 'CSRF token mismatch',
      unauthenticated: 'Unauthenticated',
    },
  },
  //...
})
```
<details>
<summary>The list of all currently available options</summary>

```typescript
interface ModuleOptions {
  /**
   * The base URL of the API server.
   * @example http://localhost:8000
   */
  apiBaseURL: string

  /**
   * The current application base URL for the Referrer and Origin header.
   * @example 'http://localhost:3000'
   */
  originUrl?: string

  /**
   * The authentication mode.
   */
  authMode: 'cookie' | 'token'

  /**
   * The key to use to store the authenticated user in the `useState` variable.
   */
  userStateKey: string

  /**
   * Defines the key used to extract user data from the `endpoints.user` API response.
   *
   * Example usage: for response `{ user: { ... } }` it would be `user`
   */
  userResponseKey?: null | string

  /**
   * The token specific options.
   */
  token: {
    /**
     * The key to store the token in the storage.
     */
    storageKey: string

    /**
     * The storage type to use for the token.
     */
    storageType: 'cookie' | 'localStorage'

    /**
     * Defines the key used to extract user data from the `endpoints.login` API response.
     *
     * Example usage: for response `{ auth_token: { ... } }` it would be `auth_token`
     */
    responseKey: string
  }

  /**
   * Fetch options.
   */
  fetchOptions: {
    /**
     * The number of times to retry a request when it fails.
     */
    retryAttempts: number | false
  }

  /**
   * CSRF token options.
   */
  csrf: {
    /**
     * Name of the CSRF cookie to extract from server response.
     */
    cookieName: string

    /**
     * Name of the CSRF header to pass from client to server.
     */
    headerName: string
  }

  /**
   * API endpoints.
   */
  endpoints: {
    /**
     * The endpoint to obtain a new CSRF token.
     */
    csrf: string

    /**
     * The authentication endpoint.
     */
    login: string

    /**
     * The logout endpoint.
     */
    logout: string

    /**
     * The endpoint to fetch current user data.
     */
    user: string
  }

  /**
   * Redirect specific settings.
   */
  redirect: {
    /**
     * Specifies whether to retain the requested route when redirecting after login.
     */
    intendedEnabled: boolean

    /**
     * Redirect path when access requires user authentication.
     * Throws a 403 error if set to false.
     */
    login: string | false

    /**
     * Redirect path after a successful login.
     * No redirection if set to false.
     */
    postLogin: string | false

    /**
     * Redirect path after a logout.
     * No redirection if set to false.
     */
    postLogout: string | false
  }

  middlewareNames: {
    /**
     * Middleware name for authenticated users.
     */
    auth: string

    /**
     * Middleware name for guest users.
     */
    guest: string
  }

  errorMessages: {
    /**
     * A default error message.
     */
    default: string

    /**
     * Error message to display when csrf token isn't valid.
     */
    csrf: string

    /**
     * Error message to display when user is not-authenticated.
     */
    unauthenticated: string
  }
}
```
</details>

---

## Usage

The module comes with two main composables `useAuth`, which takes care of the authentication and `useHttp` to handle http calls to your api gateway using the most common request methods: `get`, `post`, `put`, `patch` and `destroy` (since `delete` is a reserved keyword).

### Authentication (useAuth)

To authenticate the user against laravel sanctum, use the `login` method of the `useAuth` composable - here's an example of how this can be achieved in combination with [NuxtUiPro Form](https://ui.nuxt.com/components/form).

```vue

<template>
  <UForm :state="form" class="space-y-4" @submit="submit">
    <UFormField :error="errorFor('email')" label="Email" name="email">
      <UInput v-model="form.email" />
    </UFormField>

    <UFormField :error="errorFor('password')" label="Password" name="password">
      <UInput v-model="form.password" type="password" />
    </UFormField>

    <UButton type="submit">
      <span v-if="processing">Processing</span>
      <span v-else>Submit</span>
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>
import { Reactive } from 'vue';

const {
  login,
  processing,
  errorBag: {
    message,
    get: errorFor,
  }
} = useAuth();

interface Login {
  email: string
  password: string
}

const form: Reactive<Login> = reactive({
  email: '',
  password: '',
})

const toast = useToast()

const submit = async () => {
  try {
    await login(form);
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```

To log user out you can use `logout` method of the `useAuth` composable:

```vue
<template>
  <button type="button" @click="logMeOut">Logout</button>
</template>
<script lang="ts" setup>
const { logout } = useAuth()

const logMeOut = () => {
  logout();
}
</script>
```

You can also pass through a callback function to the `logout` method should you want to overwrite a default redirect behaviour:

```javascript
const logMeOut = () => {
  logout(() => {
    console.log('I have logged out!')
    navigateTo('/')
  });
}
```

You can check if user is authenticated by using `isLoggedIn` and to obtain an instance of the currently authenticated user use the `user` property:

```vue
<template>
  <p v-if="isLoggedIn">
    {{ user.name }}
    <span class="text-xs">{{ user.email }}</span>
  </p>
</template>
<script lang="ts" setup>
const { user, isLoggedIn } = useAuth()
</script>
```

### Http Client (useHttp)

You can use `useHttp` composable to perform requests to the api gateway using the most common request methods, represented by the corresponding method:

#### get / delete

Both `get` and `destroy` (`delete` is a reserved keyword so we had to come up with something close enough) share the same interface - here's an example how you can use `get` method:

```typescript
const { get, errorBag: { message } } = useHttp()

const getProducts = async () => {
    try {        
        const products = await get('/products')        
    } catch (error: Error) {
        toast.add({
            title: 'Error',
            description: message,
            color: 'error'
        })
    }
}
```

If you would like to append some query parameters to your url simply pass it as a second argument:

```typescript
const products = await get('/products', {
    page: 2
})
```

You can also pass any additional options as a third argument, which will be merged and passed through to the underlying `$Fetch` instance.
```typescript
const products = await get(
    '/products', 
    {
        page: 2
    }, 
    {
        retry: 3,
        retryDelay: 300
    }
)
```

#### post / put / patch

Again, all three share the same interface - an example below shows how you can use the `post` method to make a call:

```typescript
import type { Reactive } from 'vue';

const { post, errorBag: { message } } = useHttp()

interface Product {
    name: string,
    price?: number
}

const form: Reactive<Product> = reactive({
    name: '',
    price: null,
})

const createProduct = async () => {
    try {        
        await post('/products', form)        
    } catch (error: Error) {
        toast.add({
            title: 'Error',
            description: message,
            color: 'error'
        })
    }
}
```

The same as with the `get` method, you can pass any additional options to the call as a third argument:

```typescript
await post('/products', form, {
    retry: 3,
    retryDelay: 300
})
```

### Error bag

To simplify parsing of the errors, both `useAuth` and `useHttp` provide access to the underlying instance of the `useErrorBag` composable by the means of the `errorBag` property.

You can use this property to access the returned error `message` and, in case of the request that validates input `errors` property consisting of all validation errors.

The property also provides helper methods such as:

* `has`: to determine whether there is an error message available for a field
* `get`: to obtain the error message for a field

Here's a simple example of the above in action:

```vue
<template>
  <UForm :state="form" class="space-y-4" @submit="createProduct">
    <UFormField :error="errorFor('name')" label="Product name" name="name">
      <UInput
          v-model="form.name"
          :class="{ 'border-red-700': hasError('name') }"
      />
    </UFormField>

    <UFormField :error="errorFor('price')" label="Price" name="price">
      <UInput
          v-model="form.price"
          type="number"
          :class="{ 'border-red-700': hasError('price') }"
      />
    </UFormField>

    <UButton type="submit">
      Submit
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>
import type { Reactive } from "vue";

const { 
  post, 
  errorBag: { 
    message, 
    get: errorFor, 
    has: hasError 
  } 
} = useHttp();

interface Product {
  name: string,
  price?: number
}

const form: Reactive<Product> = reactive({
  name: '',
  price: null,
})

const toast = useToast()

const createProduct = async () => {
  try {
    await post('/products', form)
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```

### Processing status

Both `useAuth` and `useHttp` also come with the `processing` property, which indicates when the request is in progress by setting its value to boolean `true` or `false` - you can use it in a following way:

```vue
<template>
  <UForm :state="form" class="space-y-4" @submit="submit">
    //...
    <UButton type="submit">
      <span v-if="processing">Processing</span>
      <span v-else>Submit</span>
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>

const {
  post,
  processing,
  errorBag: {
    message,
    //...
  }
} = useHttp();

const form = reactive({
  //...
})

const toast = useToast()

const submit = async () => {
  try {
    await post(form);
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```
## License

This module is licensed under the [MIT license](https://opensource.org/license/MIT).