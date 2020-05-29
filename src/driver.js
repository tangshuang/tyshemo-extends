import Parser from './parser.js'
import Mocker from './mocker.js'
import ScopeX from 'scopex'
import {
  Model,
} from 'tyshemo'
import {
  map,
  inArray,
} from 'ts-fns'

export class Driver {
  constructor({ types = {}, loaders = [] } = {}) {
    this._parser = new Parser(types)
    this._mocker = new Mocker(loaders)
  }

  /**
   *
   * @param {*} json {
   *   schema: {
   *     name: {
   *       default: '',
   *       type: 'string',
   *       required: 'age > 0',
   *     },
   *     age: {
   *       default: 0,
   *       type: 'number',
   *     },
   *   },
   *   methods: {},
   * }
   */
  model(json) {
    const driver = this
    class DriveModel extends Model {
      schema() {
        return map(json, def => map(def, (exp, key) => {
          if (inArray(key, [
            'compute',
            'required',
            'readonly',
            'disabled',
            'hidden',
            'drop',
            'map',
            'flat',
          ])) {
            return function() {
              return new ScopeX(this).parse(exp)
            }
          }
          else if (inArray(key, [
            'getter',
            'setter',
          ])) {
            return function($value) {
              return new ScopeX({ $value }).parse(exp)
            }
          }
          else if (key === 'validators') {
            return exp.map(validator => map(validator, (f) => {
              return function() {
                return new ScopeX(this).parse(f)
              }
            }))
          }
          else if (key === 'create') {
            return function($data) {
              return new ScopeX({ $data }).parse(exp)
            }
          }
          else if (key === 'type') {
            return driver._parser.parse(exp)
          }
          else {
            return exp
          }
        }))
      }
    }

    return DriveModel
  }

  type(json) {
    const type = this._parser.parse(json)
    return type
  }

  mocker(json) {
    const type = this.type(json)
    const data = this._mocker.mock(type)
    return data
  }

  /**
   * driver.load('model', 'http://xxx/a.json').then((SomeModel) => {
   *   ...
   * })
   * @param {*} target
   * @param {*} url
   */
  load(target, url) {
    return fetch(url).then(res => res.json()).then(json => this[target](json))
  }
}
export default Driver
