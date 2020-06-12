import TypeParser from './type-parser.js'
import ScopeX from 'scopex'
import { Model } from 'tyshemo'
import {
  map,
  inArray,
  isString,
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
  parse(json) {
    const parser = this

    class ParsedModel extends Model {
      schema() {
        const model = this
        const scopex = new ScopeX(model)

        return map(json, def => map(def, (exp, key) => {
          if (!isString(exp)) {
            return exp
          }

          if (key === 'type') {
            return parser._typeParser.parse(exp)
          }

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
            return () => scopex.parse(exp)
          }

          if (inArray(key, [
            'getter',
            'setter',
          ])) {
            return $value => new ScopeX({ ...model, $value }).parse(exp)
          }

          if (key === 'validators') {
            return exp.map(validator => map(validator, (exp) => {
              return $value => new ScopeX({ ...model, $value }).parse(exp)
            }))
          }

          if (key === 'create') {
            return $data => new ScopeX({ ...model, $data }).parse(exp)
          }

          return exp
        }))
      }
    }

    return ParsedModel
  }
}
export default ModelParser
