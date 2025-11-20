// Интерфейс компаратора
interface IComparator {
    // Сравнение элементов
    compare(a: any, b: any, context?: DeepEqualEngine): boolean;

    // Возможность использования компаратора
    canHandle(value: any): boolean;
}

// Реализация сравнения примитивных типов
class PrimitiveComparator implements IComparator {
    canHandle(value: any) {
        return value == null || typeof value !== 'object';
    }

    compare(a: any, b: any) {
        return a === b;
    }
}

// Реализация сравнения массивов
class ArrayComparator implements IComparator {
    canHandle(value: any) {
        return Array.isArray(value);
    }

    compare(a: [], b: [], context: DeepEqualEngine) {
        if (!Array.isArray(b) || a.length !== b.length) {
            return false;
        }

        return a.every((item, index) => context.deepEqual(item, b[index]));
    }
}

// Реализация сравнения объектов
class ObjectComparator implements IComparator {
    canHandle(value: any) {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    }

    compare(a: any, b: any, context: DeepEqualEngine) {
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
    private comparators: IComparator[] = [];
    private visited: WeakSet<WeakKey>;

    constructor() {
        this.comparators = [
            new PrimitiveComparator(),
            new ArrayComparator(),
            new ObjectComparator(),
        ];
        this.visited = new WeakSet();
    }

    deepEqual(a: any, b: any) {
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
    findComparator(value: any) {
        return this.comparators.find(comp => comp.canHandle(value));
    }

    // Метод для добавления новых компараторов
    addComparator(comparator: IComparator) {
        this.comparators.unshift(comparator); // добавляем в начало для приоритета
    }

    // Тест
    test(a: any, b: any) {
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

type objTest = { a: number, children?: objTest }

const obj4: objTest = {a: 313};
obj4.children = obj4;

engine.test(obj4, obj4);
engine.test(obj1, obj4);

console.log("> Сравнение разных типов:");
engine.test([1, 2, 3], "123");
engine.test({a: 4, b: 5, c: 6}, [4, 5, 6]);
engine.test(null, undefined);
