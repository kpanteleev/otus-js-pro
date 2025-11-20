// Базовый абстрактный класс
class AComparator {
    constructor() {
        if (this.constructor === AComparator)
            throw new Error('Нельзя создать экземпляр абстрактного класса');
    }

    // Сравнение элементов
    compare(a, b) {
        throw new Error('Метод compare должен быть переопределен');
    }

    // Возможность использования компаратора
    canHandle(value) {
        throw new Error('Метод canHandle должен быть переопределен');
    }
}

// Сравнение примитивных типов
class PrimitiveComparator extends AComparator {
    canHandle(value) {
        return value == null || typeof value !== 'object';
    }

    compare(a, b) {
        return a === b;
    }
}

// Сравнение массивов
class ArrayComparator extends AComparator {
    canHandle(value) {
        return Array.isArray(value);
    }

    compare(a, b, context) {
        if (!Array.isArray(b) || a.length !== b.length) {
            return false;
        }

        return a.every((item, index) => context.deepEqual(item, b[index]));
    }
}

// Сравнение объектов
class ObjectComparator extends AComparator {
    canHandle(value) {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    }

    compare(a, b, context) {
        if (typeof b !== 'object' || b == null || Array.isArray(b)) {
            return false;
        }

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) {
            return false;
        }

        return keysA.every(
            key => keysB.includes(key) && context.deepEqual(a[key], b[key])
        );
    }
}

// Класс движка сравнений
class DeepEqualEngine {
    constructor() {
        this.comparators = [
            new PrimitiveComparator(),
            new ArrayComparator(),
            new ObjectComparator(),
        ];
        this.visited = new WeakSet();
    }

    deepEqual(a, b) {
        // Проверка на циклические ссылки
        if (typeof a === 'object' && a !== null) {
            if (this.visited.has(a)) {
                return a === b;
            }
            this.visited.add(a);
        }

        // Поиск подходящего компаратора
        const comparator = this.findComparator(a);
        if (!comparator) {
            throw new Error(`Не найден компаратор для типа: ${typeof a}`);
        }

        return comparator.compare(a, b, this);
    }

    // Поиск подходящего компаратора
    findComparator(value) {
        return this.comparators.find(comp => comp.canHandle(value));
    }

    // Метод для добавления новых компараторов
    addComparator(comparator) {
        if (!(comparator instanceof AComparator)) {
            throw new Error('Компаратор должен наследоваться от класса AComparator');
        }

        this.comparators.unshift(comparator); // добавляем в начало для приоритета
    }

    // Тест
    test(a, b) {
        const result = engine.deepEqual(a, b);
        console.log(a, `=`, b, `is`, result);
        return result;
    }
}

const engine = new DeepEqualEngine();

console.log("> Примитивы:");
engine.test(1, 1);
engine.test(1, 1);
engine.test("abc", "abc");
engine.test("abc", "ABC");

console.log("> Массивы:");
engine.test([1, 2, 3], [1, 2, 3]);
engine.test([1, 2, 3], [3, 2, 1]);

console.log("> Вложенные объекты:");

const obj1 = {a: 1, b: [2, 3], c: {d: 4}};
const obj2 = {a: 1, b: [2, 3], c: {d: 4}};
const obj3 = {d: 4, e: [3, 1, 2], f: {g: 8}};

engine.test(obj1, obj2);
engine.test(obj1, obj3);

console.log("> Циклические ссылки:");

const obj4 = {a : 313};
obj4.children = obj4;

engine.test(obj4, obj4);
engine.test(obj1, obj4);

console.log("> Сравнение разных типов:");
engine.test([1, 2, 3], "123");
engine.test({a: 4, b: 5, c: 6}, [4, 5, 6]);
engine.test(null, undefined);
