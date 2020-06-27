# ModelParser

To parse a model from a json.

## Usage

```js
import { ModelParser } from 'tyshemo-x'

const parser = new ModelParser()

const json = {
  "schema": {
    "name": {
      "default": "tomy",
      "type": "string",
      "required()": "age > 10"
    },
    "age": {
      "default": 10,
      "type": "number"
    }
  },
  "state": {
    "is_adult": false
  },
  "metas": {
    "name": ""
  },
  "methods": {
    "getWeight()": "age * 5"
  }
}
const SomeModel = parser.parse(json)
```

The instance of ModelParser has only `parse` method. The method receive a json and return a Model.

## JSON

The json is a description of model's schema, state, metas, and methods.

However, it is not possible to transfer instances of classes by http, we can not create a schema property with default value as a function or a instance of some class. Only primative types can be used here.

**computed expression**

To describe functions for schema properties, such as required, map, flat and so on, these properties are treated as computed expression.

```json
{
  "name": {
    "default": "tomy",
    "type": "string",
    "required()": "age > 10" // notice here, `"required()": "age > 10"` means `required() { return this.age > 10 }`, there is a `()` after `required` property
  },
  "age": {
    "default": 10,
    "type": "number"
  }
}
```

For some function metas, they receive parameters, you should do like this:

```json
{
  "some": {
    "map(v)": "v.name" // `v` as parameter for `map`
  }
}
```

Notice, parameters names should never be same with some of model, or it will make error. For example:

```json
{
  "name": {
    "default": ""
  },
  "length": {
    "default": 0,
    "map(name)": "name.length" // Error, "name" has been declared in model, should not be declared again in "map(name)"
  }
}
```

And, in computed expression, you should use `''` to wrapper a normal string. For example, if you want required to return a string, you should must wrap the string in `''`:

```json
{
  "age": {
    "default": 10,
    "type": "number",
    "required()": "'age is required'"
    // means `required() { return 'age is required' }`
    // you'd better to use `"required": "age is required"` instead
  }
}
```

**sub models**

To parse sub-models, you can use a `<>` to wrapper the meta:

```json
{
  "<submodel>": { // this meta named `submodel` will be parsed by current parser.
    "schema": {
      "name": {
        "default": "",
        "type": "string"
      }
    }
  }
}
```

**handle**

`parse` method receive the second parameter `handle` function.

```js
parser.parse(json, handle)
```

The handle function give you a chance to transform json node before model created.

```js
const handle = function(key, params, exp, type) {
  // key: the receive node's name, i.e. `required` `map` and so on
  // params: array, given parameters of the receive node's name, i.e. `map(v, k, d)` then you will get `['v', 'k', 'd']`
  // exp: the receive node's value, i.e. `"map(v)": "v.name"` then you will get `'v.name'`
  // type: schema|method

  // return [key, params, exp], if exp is not a string, it will be used as the node's new value directly, for exmaple:
  if (type === 'schema' && key === 'map') {
    return [key, params, function(v) {
      return v.name
    }]
  }

  return [key, params, exp]
}
```

**define**

In some case, you want to define some context before parse, you can use define method:

```js
parser.define('SomeModel', SomeModel)
parser.parse({
  schema: {
    '<some>': 'SomeModel', // this will be parsed to `some: SomeModel`
  }
})
```
