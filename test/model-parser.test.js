import ModelParser from '../src/model-parser.js'
import json from './model.json'

describe('ModelParser', () => {
  test('parse', () => {
    const parser = new ModelParser()
    const Model = parser.parse(json)

    let errorCount = 0
    class SomeModel extends Model {
      onError() {
        errorCount ++
      }
    }
    const model = new SomeModel()

    expect(model.name).toBe('tomy')
    expect(model.age).toBe(10)

    model.age = '0'
    expect(model.age).toBe('0')
    expect(errorCount).toBe(1)

    expect(model.$views.name.required).toBe(false)
    model.age = 11
    expect(model.$views.name.required).toBe(true)

    expect(model.getWeight()).toBe(55)
  })
})
