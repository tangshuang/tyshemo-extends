import TypeParser from './type-parser.js'
import ScopeX from 'scopex'
import { Model } from 'tyshemo'
import {
  map,
  clone,
  each,
  isUndefined,
  isString,
  isFunction,
  isArray,
  inObject,
} from 'ts-fns'

export class ModelParser {
  constructor(types) {
    this.init(types)
  }

  init(types = {}) {
    this._typeParser = new TypeParser(types)
  }

  /**
   *
   * @param {object} json {
   *   "schema": {
   *     "name": {
   *       "default": "",
   *       "type": "string",
   *       "required()": "age > 0",
   *     },
   *     "age": {
   *       "default": 0,
   *       "type": "number",
   *     },
   *   },
   *   "state": {
   *     "is_found": false
   *   },
   *   "metas": {},
   *   "methods": {
   *     "doSome(v)": "name = v",
   *   },
   * }
   */
  parse(json, handle) {
    const parser = this
    const { schema, state = {}, metas = {}, methods = {} } = json

    const createFn = (scopex, exp, params, _attr) => (...args) => {
      const { scope } = scopex
      const patched = {}

      params.forEach((param, i) => {
        if (inObject(param, scope)) {
          throw new Error(`"${param}" has been declared in model, should not be declared again in "${_attr}"!`)
        }

        const value = args[i]
        scope[param] = value
        patched[param] = true
      })

      const result = scopex.parse(exp)

      params.forEach((param) => {
        if (patched[param]) {
          delete scope[param]
        }
      })

      return result
    }

    const parseAttr = (str) => {
      const matched = str.match(/([a-zA-Z0-9_$]+)(\((.*?)\))?/)
      if (!matched) {
        return [str]
      }

      const method = matched[1]
      if (!method) {
        return [str]
      }

      const m = matched[3]
      if (isUndefined(m)) {
        return [method]
      }

      // empty string, i.e. `required()`
      if (!m) {
        return [method, []]
      }

      const s = m || ''
      const none = undefined
      const params = s.split(',').map(item => item.trim() || none)

      return [method, params]
    }

    class ParsedModel extends Model {
      state() {
        return clone(state)
      }
      schema() {
        const scopex = new ScopeX(this)

        return map(schema, (def) => {
          const meta = {}
          each(def, (_exp, attr) => {
            const [_key, _params] = parseAttr(attr)
            const [key, params, exp] = isFunction(handle) ? handle(_key, _params, _exp, 'schema') : [_key, _params, _exp]

            if (!isString(exp)) {
              meta[key] = exp
              return
            }

            /**
             * {
             *   "meta": "content text",
             *   "type": "string",
             *   "validators": [
             *     {
             *       "determine(value)": "value > 0"
             *       "validate(value)": "value > 5",
             *       "message": "should greater then 5"
             *     }
             *   ]
             * }
             */
            if (!isArray(params)) {
              if (key === 'type') {
                const type = parser._typeParser.parse(exp)
                meta.type = type
                return
              }

              if (key === 'validators') {
                const items = []
                exp.map((validator) => {
                  const item = {}
                  each(validator, (_exp, attr) => {
                    const [_key, _params] = parseAttr(attr)
                    const [key, params, exp] = isFunction(handle) ? handle(_key, _params, _exp, 'schema') : [_key, _params, _exp]

                    if (isFunction(exp)) {
                      item[key] = exp
                      return
                    }

                    if (!isArray(params)) {
                      item[key] = exp
                      return
                    }

                    const value = createFn(scopex, exp, params, attr)
                    item[key] = value
                  })
                  items.push(item)
                })
                meta.validators = items
                return
              }

              meta[key] = exp
              return
            }

            /**
             * {
             *   "drop(v)": "v > 6 && age > 20"
             * }
             */
            const value = createFn(scopex, exp, params, attr)
            meta[key] = value
          })
          return meta
        })
      }
      metas() {
        return metas
      }
    }

    each(methods, (_exp, attr) => {
      if (!isString(_exp)) {
        return
      }

      const [_key, _params] = parseAttr(attr)
      if (!_params) {
        return
      }

      const [key, params, exp] = isFunction(handle) ? handle(_key, _params, _exp, 'method') : [_key, _params, _exp]

      if (isFunction(exp)) {
        ParsedModel.prototype[key] = exp
        return
      }

      if (!isString(exp)) {
        return
      }

      ParsedModel.prototype[key] = function(...args) {
        const scopex = new ScopeX(this)
        const res = createFn(scopex, exp, params, attr)(...args)
        return res
      }
    })

    return ParsedModel
  }
}
export default ModelParser
