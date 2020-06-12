import ModelParser from '../src/model-parser.js'

describe('ModelParser', () => {
  test('parse', () => {
    const json = {
      name: {
        default: 'tomy',
        type: 'string',
        required: 'age > 10',
      },
      age: {
        default: 10,
        type: 'number',
      },
    }

    const parser = new ModelParser()
    const Model = parser.parse(json)
    class SomeModel extends Model {
      onError() {}
    }
    const model = new SomeModel()

    expect(model.name).toBe('tomy')
    expect(model.age).toBe(10)

    model.age = '0'
    expect(model.age).toBe(10)

    expect(model.$views.name.required).toBe(false)
    model.age = 11
    expect(model.$views.name.required).toBe(true)
  })
})
