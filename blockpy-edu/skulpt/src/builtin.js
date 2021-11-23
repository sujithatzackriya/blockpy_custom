/** @typedef {Sk.builtin.object} */ var pyObject;

/**
 * builtins are supposed to come from the __builtin__ module, but we don't do
 * that yet.
 * todo; these should all be func objects too, otherwise str() of them won't
 * work, etc.
 */

const JSBI = require("jsbi");

Sk.builtin.asnum$ = function (a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (typeof a === "number") {
        return a;
    }
    if (a instanceof Sk.builtin.int_) {
        if (typeof a.v === "number") {
            return a.v;
        }
        return a.v.toString(); // then we have a BigInt
    }
    if (a instanceof Sk.builtin.float_) {
        return a.v;
    }
    if (a === Sk.builtin.none.none$) {
        return null;
    }
    if (typeof a === "string") {
        return a;
    }
    return a;
};

Sk.exportSymbol("Sk.builtin.asnum$", Sk.builtin.asnum$);

/**
 * Return a Python number (either float or int) from a Javascript number.
 *
 * Javacsript function, returns Python object.
 *
 * @param  {number} a Javascript number to transform into Python number.
 * @return {(Sk.builtin.int_|Sk.builtin.float_)} A Python number.
 */
Sk.builtin.assk$ = function (a) {
    if (a % 1 === 0) {
        return new Sk.builtin.int_(a);
    } else {
        return new Sk.builtin.float_(a);
    }
};
Sk.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

Sk.builtin.asnum$nofloat = function (a) {
    var decimal;
    var mantissa;
    var expon;
    if (a === undefined) {
        return a;
    } else if (a === null) {
        return a;
    } else if (typeof a === "number") {
        a = a.toString();
    } else if (a instanceof Sk.builtin.int_) {
        a = a.v.toString();
    } else if (a instanceof Sk.builtin.float_) {
        a = a.v.toString();
    } else if (a === Sk.builtin.none.none$) {
        return null;
    } else {
        return undefined;
    }

    //  Sk.debugout("INITIAL: " + a);

    //  If not a float, great, just return this
    if (a.indexOf(".") < 0 && a.indexOf("e") < 0 && a.indexOf("E") < 0) {
        return a;
    }

    expon = 0;

    if (a.indexOf("e") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("e") + 1);
    } else if (a.indexOf("E") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("E") + 1);
    } else {
        mantissa = a;
    }

    expon = parseInt(expon, 10);

    decimal = mantissa.indexOf(".");

    //  Simplest case, no decimal
    if (decimal < 0) {
        if (expon >= 0) {
            // Just add more zeroes and we're done
            while (expon-- > 0) {
                mantissa += "0";
            }
            return mantissa;
        } else {
            if (mantissa.length > -expon) {
                return mantissa.substr(0, mantissa.length + expon);
            } else {
                return 0;
            }
        }
    }

    //  Negative exponent OR decimal (neg or pos exp)
    if (decimal === 0) {
        mantissa = mantissa.substr(1);
    } else if (decimal < mantissa.length) {
        mantissa = mantissa.substr(0, decimal) + mantissa.substr(decimal + 1);
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    decimal = decimal + expon;
    while (decimal > mantissa.length) {
        mantissa += "0";
    }

    if (decimal <= 0) {
        mantissa = 0;
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    return mantissa;
};
Sk.exportSymbol("Sk.builtin.asnum$nofloat", Sk.builtin.asnum$nofloat);

Sk.builtin.round = function round(number, ndigits) {
    if (number === undefined) {
        throw new Sk.builtin.TypeError("a float is required");
    }
    if (!Sk.__future__.dunder_round) {
        if (!Sk.builtin.checkNumber(number)) {
            throw new Sk.builtin.TypeError("a float is required");
        }
        if (number.round$) {
            return number.round$(ndigits);
        } else {
            throw new Sk.builtin.AttributeError(Sk.abstr.typeName(number) + " instance has no attribute '__float__'");
        }
    }

    if (ndigits !== undefined && !Sk.builtin.checkNone(ndigits) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    // try calling internal magic method
    const special = Sk.abstr.lookupSpecial(number, Sk.builtin.str.$round);
    if (special !== undefined) {
        // method on builtin, provide this arg
        if (ndigits !== undefined) {
            return Sk.misceval.callsimArray(special, [number, ndigits]);
        } else {
            return Sk.misceval.callsimArray(special, [number]);
        }
    } else {
        throw new Sk.builtin.TypeError("a float is required");
    }
};

Sk.builtin.len = function len(item) {
    // checking will happen in slot wrapper
    let res;
    if (item.sq$length) {
        res = item.sq$length(true);
    }
    if (res === undefined) {
        throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
    }
    return Sk.misceval.chain(res, (r) => {
        return new Sk.builtin.int_(r);
    });
};

Sk.builtin.min = function min(args, kwargs) {
    let iter;
    const nargs = args.length;
    if (!nargs) {
        throw new Sk.builtin.TypeError("min expected 1 argument, got 0");
    }
    const default_key = Sk.abstr.copyKeywordsToNamedArgs("min", ["default", "key"], [], kwargs, [null, Sk.builtin.none.none$]);
    const $default = default_key[0];
    const key = default_key[1];

    // if args is not a single iterable then default should not be included as a kwarg
    if (nargs > 1 && $default !== null) {
        throw new Sk.builtin.TypeError("Cannot specify a default for min() with multiple positional arguments");
    }

    if (nargs == 1) {
        iter = Sk.abstr.iter(args[0]);
    } else {
        iter = Sk.abstr.iter(new Sk.builtin.tuple(args));
    }

    if (!Sk.builtin.checkNone(key) && !Sk.builtin.checkCallable(key)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(key) + "' object is not callable");
    }

    let lowest = iter.tp$iternext();

    if (lowest === undefined) {
        if ($default === null) {
            throw new Sk.builtin.ValueError("min() arg is an empty sequence");
        } else {
            return $default;
        }
    }
    if (Sk.builtin.checkNone(key)) {
        for (let i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
            if (Sk.misceval.richCompareBool(i, lowest, "Lt")) {
                lowest = i;
            }
        }
    } else {
        let lowest_compare = Sk.misceval.callsimArray(key, [lowest]);
        for (let i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
            let i_compare = Sk.misceval.callsimArray(key, [i]);
            if (Sk.misceval.richCompareBool(i_compare, lowest_compare, "Lt")) {
                lowest = i;
                lowest_compare = i_compare;
            }
        }
    }
    return lowest;
};

Sk.builtin.max = function max(args, kwargs) {
    let iter;
    const nargs = args.length;

    if (!nargs) {
        throw new Sk.builtin.TypeError("max expected 1 argument, got 0");
    }
    const default_key = Sk.abstr.copyKeywordsToNamedArgs("min", ["default", "key"], [], kwargs, [null, Sk.builtin.none.none$]);
    const $default = default_key[0];
    const key = default_key[1];

    // if args is not a single iterable then default should not be included as a kwarg
    if (nargs > 1 && $default !== null) {
        throw new Sk.builtin.TypeError("Cannot specify a default for max() with multiple positional arguments");
    }

    if (nargs === 1) {
        iter = Sk.abstr.iter(args[0]);
    } else {
        iter = Sk.abstr.iter(new Sk.builtin.tuple(args));
    }

    if (!Sk.builtin.checkNone(key) && !Sk.builtin.checkCallable(key)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(key) + "' object is not callable");
    }

    let highest = iter.tp$iternext();

    if (highest === undefined) {
        if ($default === null) {
            throw new Sk.builtin.ValueError("max() arg is an empty sequence");
        } else {
            return $default;
        }
    }
    if (Sk.builtin.checkNone(key)) {
        for (let i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
            if (Sk.misceval.richCompareBool(i, highest, "Gt")) {
                highest = i;
            }
        }
    } else {
        let highest_compare = Sk.misceval.callsimArray(key, [highest]);
        for (let i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
            let i_compare = Sk.misceval.callsimArray(key, [i]);
            if (Sk.misceval.richCompareBool(i_compare, highest_compare, "Gt")) {
                highest = i;
                highest_compare = i_compare;
            }
        }
    }
    return highest;
};

Sk.builtin.any = function any(iter) {
    const ret = Sk.misceval.iterFor(Sk.abstr.iter(iter), function (i) {
        if (Sk.misceval.isTrue(i)) {
            return new Sk.misceval.Break(true);
        }
    });
    return ret === undefined ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
};

Sk.builtin.all = function all(iter) {
    const ret = Sk.misceval.iterFor(Sk.abstr.iter(iter), function (i) {
        if (!Sk.misceval.isTrue(i)) {
            return new Sk.misceval.Break(false);
        }
    });
    return ret === undefined ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
};

Sk.builtin.sum = function sum(iter, start) {
    var tot;
    var has_float;
    // this follows the order python checks errors
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (Sk.builtin.checkString(start)) {
        throw new Sk.builtin.TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    }
    tot = start;
    Sk.misceval.iterFor(Sk.abstr.iter(iter), function (i) {
        if (!has_float && i instanceof Sk.builtin.float_) {
            has_float = true;
            tot = new Sk.builtin.float_(Sk.builtin.asnum$(tot));
        }
        // else if (i instanceof Sk.builtin.lng) {
        //     if (!has_float && !(tot instanceof Sk.builtin.lng)) {
        //         tot = new Sk.builtin.lng(tot);
        //     }
        // }
        if (tot.nb$add !== undefined) {
            const itermed = tot.nb$add(i);
            if (itermed !== undefined && !(itermed instanceof Sk.builtin.NotImplemented)) {
                tot = itermed;
                return;
            }
        }
        throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + Sk.abstr.typeName(tot) + "' and '" + Sk.abstr.typeName(i) + "'");
    });
    return tot;
};

Sk.builtin.zip = function zip() {
    var el;
    var tup;
    var done;
    var res;
    var i;
    var iters;
    if (arguments.length === 0) {
        return new Sk.builtin.list([]);
    }

    iters = [];
    for (i = 0; i < arguments.length; i++) {
        if (Sk.builtin.checkIterable(arguments[i])) {
            iters.push(Sk.abstr.iter(arguments[i]));
        } else {
            throw new Sk.builtin.TypeError("argument " + i + " must support iteration");
        }
    }
    res = [];
    done = false;
    while (!done) {
        tup = [];
        for (i = 0; i < arguments.length; i++) {
            el = iters[i].tp$iternext();
            if (el === undefined) {
                done = true;
                break;
            }
            tup.push(el);
        }
        if (!done) {
            res.push(new Sk.builtin.tuple(tup));
        }
    }
    return new Sk.builtin.list(res);
};

Sk.builtin.abs = function abs(x) {
    if (x.nb$abs) {
        return x.nb$abs();
    }
    throw new TypeError("bad operand type for abs(): '" + Sk.abstr.typeName(x) + "'");
};

// fabs belongs in the math module but has been a Skulpt builtin since 41665a97d (2012).
// Left in for backwards compatibility for now
Sk.builtin.fabs = function fabs(x) {
    return Sk.builtin.abs(x);
};

Sk.builtin.ord = function ord(x) {
    if (!Sk.builtin.checkString(x)) {
        throw new Sk.builtin.TypeError("ord() expected a string of length 1, but " + Sk.abstr.typeName(x) + " found");
    } else if (x.v.length !== 1) {
        throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
    }
    return new Sk.builtin.int_(x.v.charCodeAt(0));
};

Sk.builtin.chr = function chr(x) {
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);

    // Should be sys.maxunicode
    if (x < 0) {
        throw new Sk.builtin.ValueError("chr() arg not in range(0x110000)");
    }

    return new Sk.builtin.str(String.fromCodePoint(x));
};

Sk.builtin.unichr = function unichr(x) {
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);

    try {
        return new Sk.builtin.str(String.fromCodePoint(x));
    } catch (err) {
        if (err instanceof RangeError) {
            throw new Sk.builtin.ValueError(err.message);
        }
        throw err;
    }
};

/**
 * This is a helper function and we already know that x is an int or has an nb$index slot
 */
Sk.builtin.int2str_ = function helper_(x, radix, prefix) {
    let v;
    if (x.constructor === Sk.builtin.int_ || x instanceof Sk.builtin.int_) {
        v = x.v; // we don't use asnum$ because it returns a str rather than a bigint. 
    } else {
        x = x.nb$index();
        v = x.v;
    }
    let str = v.toString(radix);
    if (x.nb$isnegative()) {
        str = "-" + prefix + str.slice(1);
    } else {
        str = prefix + str;
    }
    if (radix !== 2 && !Sk.__future__.python3 && (x instanceof Sk.builtin.lng || v instanceof JSBI)) {
        str += "L";
    }
    return new Sk.builtin.str(str);
};

Sk.builtin.hex = function hex(x) {
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("hex() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 16, "0x");
};

Sk.builtin.oct = function oct(x) {
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("oct() argument can't be converted to hex");
    }
    if (Sk.__future__.octal_number_literal) {
        return Sk.builtin.int2str_(x, 8, "0o");
    } else {
        return Sk.builtin.int2str_(x, 8, "0");
    }
};

Sk.builtin.bin = function bin(x) {
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(x) + "' object can't be interpreted as an index");
    }
    return Sk.builtin.int2str_(x, 2, "0b");
};


Sk.builtin.dir = function dir(obj) {
    if (obj !== undefined) {
        const obj_dir_func = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$dir);
        const dir = Sk.misceval.callsimArray(obj_dir_func, [obj]);
        return Sk.builtin.sorted(dir);
        // now iter through the keys and check they are all stings
    }
    // then we want all the objects in the global scope
    //todo
    throw new Sk.builtin.NotImplementedError("skulpt does not yet support dir with no args");
};

Sk.builtin.repr = function repr(x) {
    return x.$r();
};

Sk.builtin.open = function open(filename, mode, bufsize) {
    if (mode === undefined) {
        mode = new Sk.builtin.str("r");
    }

    if (/\+/.test(mode.v)) {
        throw "todo; haven't implemented read/write mode";
    } else if ((mode.v === "w" || mode.v === "wb" || mode.v === "a" || mode.v === "ab") && !Sk.nonreadopen) {
        throw "todo; haven't implemented non-read opens";
    }

    return new Sk.builtin.file(filename, mode, bufsize);
};

const issubclass_multiple_inheritance = function (klass, base) {
    const mro = klass.prototype.tp$mro;
    for (let i = 0; i < mro.length; i++) {
        if (base === mro[i]) {
            return true;
        }
    }
    return false;
};

Sk.builtin.isinstance = function isinstance(obj, type) {
    if (!Sk.builtin.checkClass(type) && !(type instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    // Normal case
    if (!(type instanceof Sk.builtin.tuple)) {
        // Overridden __class__
        var objType;
        var __class__ = obj.tp$getattr(Sk.builtin.str.$class);
        if (__class__ !== undefined) {
            objType = __class__;
        } else {
            objType = obj.ob$type;
        }

        return objType.$isSubType(type) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    }
    // Handle tuple type argument
    for (let i = 0; i < type.v.length; ++i) {
        if (Sk.misceval.isTrue(Sk.builtin.isinstance(obj, type.v[i]))) {
            return Sk.builtin.bool.true$;
        }
    }
    return Sk.builtin.bool.false$;
};

Sk.builtin.hash = function hash(value) {
    var junk;

    // Useless object to get compiler to allow check for __hash__ property
    junk = {
        __hash__: function () {
            return 0;
        },
    };

    if (value instanceof Object) {
        if (Sk.builtin.checkNone(value.tp$hash)) {
            // python sets the hash function to None , so we have to catch this case here
            throw new Sk.builtin.TypeError("unhashable type: '" + Sk.abstr.typeName(value) + "'");
        } else if (value.tp$hash !== undefined) {
            if (value.$savedHash_) {
                return value.$savedHash_;
            }
            value.$savedHash_ = value.tp$hash();
            return value.$savedHash_;
        } else {
            if (value.__hash === undefined) {
                Sk.builtin.hashCount += 1;
                value.__hash = Sk.builtin.hashCount;
            }
            return new Sk.builtin.int_(value.__hash);
        }
    } else if (typeof value === "number" || value === null || value === true || value === false) {
        throw new Sk.builtin.TypeError("unsupported Javascript type");
    }

    return new Sk.builtin.str(typeof value + " " + String(value));
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr(obj, pyName, default_) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }
    const res = Sk.misceval.tryCatch(
        () => obj.tp$getattr(pyName, true),
        (e) => {
            if (e instanceof Sk.builtin.AttributeError) {
                return undefined;
            } else {
                throw e;
            }
        }
    );
    return Sk.misceval.chain(res, (r) => {
        if (r === undefined) {
            if (default_ !== undefined) {
                return default_;
            }
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute " + pyName.$jsstr());
        }
        return r;
    });
};

Sk.builtin.setattr = function setattr(obj, pyName, value) {
    // cannot set or del attr from builtin type
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }
    const res = obj.tp$setattr(pyName, value, true);
    return Sk.misceval.chain(res, () => {
        return Sk.builtin.none.none$;
    });
};

Sk.builtin.raw_input = function (prompt) {
    var lprompt = prompt ? prompt : "";

    return Sk.misceval.chain(Sk.importModule("sys", false, true), function (sys) {
        if (Sk.inputfunTakesPrompt) {
            return Sk.builtin.file.$readline(sys["$d"]["stdin"], null, lprompt);
        } else {
            return Sk.misceval.chain(
                undefined,
                function () {
                    return Sk.misceval.callsimOrSuspendArray(sys["$d"]["stdout"]["write"], [sys["$d"]["stdout"], new Sk.builtin.str(lprompt)]);
                },
                function () {
                    return Sk.misceval.callsimOrSuspendArray(sys["$d"]["stdin"]["readline"], [sys["$d"]["stdin"]]);
                }
            );
        }
    });
};

Sk.builtin.input = Sk.builtin.raw_input;

Sk.builtin.jseval = function jseval(evalcode) {
    var result = Sk.global["eval"](Sk.ffi.remapToJs(evalcode));
    try {
        return Sk.ffi.remapToPy(result);
    } catch (err) {
        if (err.constructor === Sk.asserts.AssertionError) {
            return Sk.builtin.none.none$;
        }

        throw err;
    }
};

Sk.builtin.jsmillis = function jsmillis() {
    var now = new Date();
    return now.valueOf();
};

Sk.builtin.eval_ = function eval_() {
    throw new Sk.builtin.NotImplementedError("eval is not yet implemented");
};

Sk.builtin.map = function map(fun, seq) {
    var retval = [];
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    Sk.builtin.pyCheckArgsLen("map", arguments.length, 2);

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i = 0; i < iterables.length; i++) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i = 0; i < iterables.length; i++) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(Sk.builtin.none.none$);
                    nones++;
                } else {
                    args.push(next);
                }
            }
            if (nones !== iterables.length) {
                combined.push(args);
            } else {
                // All iterables are done
                break;
            }
        }
        seq = new Sk.builtin.list(combined);
    }

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    return Sk.misceval.chain(
        Sk.misceval.iterFor(Sk.abstr.iter(seq), function (item) {
            if (fun === Sk.builtin.none.none$) {
                if (item instanceof Array) {
                    // With None function and multiple sequences,
                    // map should return a list of tuples
                    item = new Sk.builtin.tuple(item);
                }
                retval.push(item);
            } else {
                if (!(item instanceof Array)) {
                    // If there was only one iterable, convert to Javascript
                    // Array for call to apply.
                    item = [item];
                }

                return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(fun, item), function (result) {
                    retval.push(result);
                });
            }
        }),
        function () {
            return new Sk.builtin.list(retval);
        }
    );
};

Sk.builtin.reduce = function reduce(fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    iter = Sk.abstr.iter(seq);
    if (initializer === undefined) {
        initializer = iter.tp$iternext();
        if (initializer === undefined) {
            throw new Sk.builtin.TypeError("reduce() of empty sequence with no initial value");
        }
    }
    accum_value = initializer;
    for (item = iter.tp$iternext(); item !== undefined; item = iter.tp$iternext()) {
        accum_value = Sk.misceval.callsimArray(fun, [accum_value, item]);
    }

    return accum_value;
};

/**
 *
 * @param {pyObject} iterable
 * @param {*=} cmp
 * @param {*=} key
 * @param {*=} reverse
 */
Sk.builtin.sorted = function sorted(iterable, cmp, key, reverse) {
    const lst = Sk.misceval.arrayFromIterable(iterable, true);
    return Sk.misceval.chain(lst, (L) => {
        L = new Sk.builtin.list(L);
        L.$list_sort(cmp, key, reverse);
        return L;
    });
};

Sk.builtin.filter = function filter(fun, iterable) {
    var result;
    var iter, item;
    var retval;
    var ret;
    var add;
    var ctor;
    Sk.builtin.pyCheckArgsLen("filter", arguments.length, 2, 2);
    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }
    ctor = function () {
        return [];
    };
    add = function (iter, item) {
        iter.push(item);
        return iter;
    };
    ret = function (iter) {
        return new Sk.builtin.list(iter);
    };

    if (iterable.ob$type === Sk.builtin.str) {
        ctor = function () {
            return new Sk.builtin.str("");
        };
        add = function (iter, item) {
            return iter.sq$concat(item);
        };
        ret = function (iter) {
            return iter;
        };
    } else if (iterable.ob$type === Sk.builtin.tuple) {
        ret = function (iter) {
            return new Sk.builtin.tuple(iter);
        };
    }

    retval = ctor();

    for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext(); item !== undefined; item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            result = new Sk.builtin.bool(item);
        } else {
            result = Sk.misceval.callsimArray(fun, [item]);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
};

Sk.builtin.hasattr = function hasattr(obj, pyName) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("hasattr(): attribute name must be string");
    }
    const res = Sk.misceval.tryCatch(
        () => obj.tp$getattr(pyName, true),
        (e) => {
            if (e instanceof Sk.builtin.AttributeError) {
                return undefined;
            } else {
                throw e;
            }
        }
    );
    return Sk.misceval.chain(res, (val) => (val === undefined ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$));
};

Sk.builtin.pow = function pow(a, b, c) {
    var ret;
    var res;
    var right;
    var left;
    var c_num;
    var b_num;
    var a_num;

    if (c instanceof Sk.builtin.none) {
        c = undefined;
    }

    // add complex type hook here, builtin is messed up anyways
    if (Sk.builtin.checkComplex(a)) {
        return a.nb$power(b, c); // call complex pow function
    }

    a_num = Sk.builtin.asnum$(a);
    b_num = Sk.builtin.asnum$(b);
    c_num = Sk.builtin.asnum$(c);

    if (!Sk.builtin.checkNumber(a) || !Sk.builtin.checkNumber(b)) {
        if (c === undefined) {
            throw new Sk.builtin.TypeError(
                "unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "' and '" + Sk.abstr.typeName(b) + "'"
            );
        }
        throw new Sk.builtin.TypeError(
            "unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "', '" + Sk.abstr.typeName(b) + "', '" + Sk.abstr.typeName(c) + "'"
        );
    }
    if (a_num < 0 && b instanceof Sk.builtin.float_) {
        throw new Sk.builtin.ValueError("negative number cannot be raised to a fractional power");
    }

    if (c === undefined) {
        if (a instanceof Sk.builtin.float_ || b instanceof Sk.builtin.float_ || b_num < 0) {
            return new Sk.builtin.float_(Math.pow(a_num, b_num));
        }
        left = new Sk.builtin.int_(a_num);
        right = new Sk.builtin.int_(b_num);
        res = left.nb$power(right);
        return res;
    } else {
        if (!Sk.builtin.checkInt(a) || !Sk.builtin.checkInt(b) || !Sk.builtin.checkInt(c)) {
            throw new Sk.builtin.TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        if (b_num < 0) {
            if (Sk.__future__.exceptions) {
                throw new Sk.builtin.ValueError("pow() 2nd argument cannot be negative when 3rd argument specified");
            } else {
                throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }
        }
        if (c_num === 0) {
            throw new Sk.builtin.ValueError("pow() 3rd argument cannot be 0");
        }
        if (a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng || c instanceof Sk.builtin.lng || Math.pow(a_num, b_num) === Infinity) {
            return a.nb$power(b, c);
        } else {
            ret = new Sk.builtin.int_(Math.pow(a_num, b_num));
            return ret.nb$remainder(c);
        }
    }
};

Sk.builtin.quit = function quit(msg) {
    var s = new Sk.builtin.str(msg).v;
    throw new Sk.builtin.SystemExit(s);
};

Sk.builtin.issubclass = function issubclass(c1, c2) {
    if (!Sk.builtin.checkClass(c1)) {
        throw new Sk.builtin.TypeError("issubclass() arg 1 must be a class");
    }
    let c2_isClass = Sk.builtin.checkClass(c2);
    if (!c2_isClass && !(c2 instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("issubclass() arg 2 must be a class or tuple of classes");
    }
    if (c2_isClass) {
        return c1.$isSubType(c2) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    }
    // Handle tuple type argument
    for (let i = 0; i < c2.v.length; ++i) {
        if (Sk.misceval.isTrue(Sk.builtin.issubclass(c1, c2.v[i]))) {
            return Sk.builtin.bool.true$;
        }
    }
    return Sk.misceval.bool.false$;
};

Sk.builtin.globals = function globals() {
    var i;
    var ret = new Sk.builtin.dict([]);
    for (i in Sk["globals"]) {
        ret.mp$ass_subscript(new Sk.builtin.str(i), Sk["globals"][i]);
    }

    return ret;
};

Sk.builtin.divmod = function divmod(a, b) {
    return Sk.abstr.numberBinOp(a, b, "DivMod");
};

/**
 * Convert a value to a “formatted” representation, as controlled by format_spec. The interpretation of format_spec
 * will depend on the type of the value argument, however there is a standard formatting syntax that is used by most
 * built-in types: Format Specification Mini-Language.
 */
Sk.builtin.format = function format(value, format_spec) {
    if (format_spec === undefined) {
        format_spec = Sk.builtin.str.$emptystr;
    }

    return Sk.abstr.objectFormat(value, format_spec);
};

Sk.builtin.reversed = function reversed(seq) {
    Sk.builtin.pyCheckArgsLen("reversed", arguments.length, 1, 1);

    var special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$reversed);
    if (special != null) {
        return Sk.misceval.callsimArray(special, [seq]);
    } else {
        if (!Sk.builtin.checkSequence(seq)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
        }

        /**
         * Builds an iterator that outputs the items form last to first.
         *
         * @constructor
         */
        var reverseIter = function (obj) {
            this.idx = obj.sq$length() - 1;
            this.myobj = obj;
            this.ob$type = Sk.builtin.type.makeTypeObj("reversed", function _reversed() {
            });
            this.getitem = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$getitem);
            this["$r"] = function () {
                return new Sk.builtin.str("<reversed>");
            },
            this.tp$iter = function () {
                return this;
            },
            this.tp$iternext = function () {
                var ret;

                if (this.idx < 0) {
                    return undefined;
                }

                try {
                    ret = Sk.misceval.callsimArray(this.getitem, [this.myobj, Sk.ffi.remapToPy(this.idx)]);
                } catch (e) {
                    if (e instanceof Sk.builtin.IndexError) {
                        return undefined;
                    } else {
                        throw e;
                    }
                }
                this.idx--;
                return ret;
            };
        };

        return new reverseIter(seq);
    }
};

Sk.builtin.id = function (obj) {
    if (obj.__id === undefined) {
        Sk.builtin.idCount += 1;
        obj.__id = Sk.builtin.idCount;
    }

    return new Sk.builtin.int_(obj.__id);
};

Sk.builtin.bytearray = function bytearray() {
    throw new Sk.builtin.NotImplementedError("bytearray is not yet implemented");
};

Sk.builtin.callable = function callable(obj) {
    // check num of args

    if (Sk.builtin.checkCallable(obj)) {
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;
};

Sk.builtin.delattr = function delattr(obj, attr) {
    return Sk.builtin.setattr(obj, attr, undefined);
};

Sk.builtin.execfile = function execfile() {
    throw new Sk.builtin.NotImplementedError("execfile is not yet implemented");
};

/**
 * Okay, I'll be honest, this is 100% not a real code object. It just holds the source
 * code and filename. I'm relying on the `exec` call to actually compile it. IT'S ALL
 * A BIG LIE. I'm sorry. -acbart
 * @param filename
 * @param source
 * @returns {Sk.builtin|*}
 */
Sk.builtin.code = function (filename, source) {
    if (!(this instanceof Sk.builtin.code)) {
        return new Sk.builtin.code(filename, source);
    }
    this.filename = filename;
    this.source = source;
    this.__class__ = Sk.builtin.code;
    return this;
};
Sk.abstr.setUpInheritance("code", Sk.builtin.code, Sk.builtin.object);
Sk.builtin.code.prototype["$r"] = function () {
    return new Sk.builtin.str("<code object, file \"" + this.filename + "\">");
};
Sk.exportSymbol("Sk.builtin.code", Sk.builtin.code);

Sk.builtin.compile = function (source, filename, mode, flags, dont_inherit, optimize) {
    Sk.builtin.pyCheckArgsLen("compile", arguments.length, 3, 6);
    source = Sk.ffi.remapToJs(source);
    filename = Sk.ffi.remapToJs(filename);
    return new Sk.builtin.code(filename, source);
};


var extractDict = function (obj) {
    var ret = {};
    var k, v, kAsJs, iter;
    if (obj === undefined) {
        return ret;
    }
    for (iter = obj.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
        v = obj.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        kAsJs = Sk.ffi.remapToJs(k);
        // todo; assert that this is a reasonble lhs?
        ret[Sk.fixReserved(kAsJs)] = v;
    }
    return ret;
};

var mergeDict = function(obj1, obj2) {
    var k, v, kAsJs, iter;
    if (obj2 === undefined) {
        return obj1;
    }
    for (iter = obj2.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
        v = obj2.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        kAsJs = Sk.ffi.remapToJs(k);
        // todo; assert that this is a reasonble lhs?
        obj1[Sk.fixReserved(kAsJs)] = v;
    }
    return obj1;
}

Sk.builtin.exec = function execf(pythonCode, new_globals, newLocals) {
    Sk.builtin.pyCheckArgs("exec", arguments, 1, 2);
    /*
    var filename = "<string>";
    if (pythonCode instanceof Sk.builtin.code) {
        filename = pythonCode.filename;
        pythonCode = pythonCode.source;
    } else {
        pythonCode = Sk.ffi.remapToJs(pythonCode);
    }
    let code = Sk.compile(pythonCode, filename, "exec", true, true);
    const tmp = Sk.globals;
    globals = new_globals || tmp;
    return Sk.misceval.chain(
        code,
        (co) => eval(co.code)(globals),
        (new_locals) => {
            Sk.globals = tmp;
            return new_locals;
        }
    );*/

    var prom = new Promise(function (resolve, reject) {
        var backupRG = Sk.retainGlobals;
        Sk.retainGlobals = true;
        var filename = "<string>";
        if (pythonCode instanceof Sk.builtin.code) {
            filename = pythonCode.filename;
            pythonCode = pythonCode.source;
        } else {
            pythonCode = Sk.ffi.remapToJs(pythonCode);
        }
        var new_globals_copy = extractDict(new_globals);
        if (!new_globals_copy.__file__) {
            new_globals_copy.__file__ = Sk.ffi.remapToPy(filename);
        }
        if (!new_globals_copy.__name__) {
            new_globals_copy.__name__ = Sk.ffi.remapToPy(filename);
        }
        if (!new_globals_copy.__package__) {
            new_globals_copy.__package__ = Sk.builtin.none.none$;
        }
        var backupGlobals = Sk.globals;
        //console.log(Sk.globals);
        Sk.globals = new_globals_copy; // Possibly copy over some "default" ones?
        //console.log(Sk.globals, new_globals);
        //mergeDict(Sk.globals, new_globals);

        var name = filename.endsWith(".py") ? filename.slice(0, -3) : filename;
        var pyName = new Sk.builtin.str(name);
        var loadModule = function() {
            var sysModules = Sk.sysmodules.mp$subscript(Sk.builtin.str.$sys);
            var modname = name;
            var caughtError = null;
            const res = Sk.misceval.tryCatch(() => {
                Sk.importModuleInternal_(name, false, modname, pythonCode, undefined, false, true);
                //console.log(Sk.sysmodules.mp$subscript(pyName).$js);
            }, (e) => {
                console.error("SYSTEMATIC ERROR", e);
                caughtError = e;
            });
            Sk.misceval.chain(res, function() {
                Sk.globals = backupGlobals;
                // Only try to delete if we succeeded in creating it!
                if (Sk.sysmodules.mp$lookup(pyName)) {
                    Sk.sysmodules.del$item(pyName);
                }
                for (var key in new_globals_copy) {
                    if (new_globals_copy.hasOwnProperty(key)) {
                        var pykey = Sk.ffi.remapToPy(Sk.unfixReserved(key));
                        Sk.builtin.dict.prototype.mp$ass_subscript.call(new_globals, pykey, new_globals_copy[key]);
                        //Sk.builtin.dict.prototype.mp$ass_subscript.call(Sk.globals, pykey, Sk.globals[key]);
                    }
                }
                Sk.retainGlobals = backupRG;
                if (caughtError !== null) {
                    throw caughtError;
                }
                resolve();
            });
        };
        if (!Sk.sysmodules.sq$contains(Sk.builtin.str.$sys)) {
            Sk.misceval.chain(Sk.importModule("sys", false, true),
                              loadModule);
        } else {
            loadModule();
        }
    });

    return Sk.misceval.promiseToSuspension(prom);
};

Sk.builtin.frozenset = function frozenset() {
    throw new Sk.builtin.NotImplementedError("frozenset is not yet implemented");
};

Sk.builtin.help = function help() {
    throw new Sk.builtin.NotImplementedError("help is not yet implemented");
};

Sk.builtin.iter = function iter(obj, sentinel) {
    if (arguments.length === 1) {
        return Sk.abstr.iter(obj);
    } else {
        return Sk.abstr.iter(new Sk.builtin.callable_iter_(obj, sentinel));
    }
};

Sk.builtin.locals = function locals() {
    throw new Sk.builtin.NotImplementedError("locals is not yet implemented");
};
Sk.builtin.memoryview = function memoryview() {
    throw new Sk.builtin.NotImplementedError("memoryview is not yet implemented");
};

Sk.builtin.next_ = function next_(iter, default_) {
    var nxt;
    if (!iter.tp$iternext) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) + "' object is not an iterator");
    }
    nxt = iter.tp$iternext();
    if (nxt === undefined) {
        if (default_) {
            return default_;
        }
        throw new Sk.builtin.StopIteration();
    }
    return nxt;
};

Sk.builtin.reload = function reload() {
    throw new Sk.builtin.NotImplementedError("reload is not yet implemented");
};
Sk.builtin.vars = function vars() {
    throw new Sk.builtin.NotImplementedError("vars is not yet implemented");
};

Sk.builtin.apply_ = function apply_() {
    throw new Sk.builtin.NotImplementedError("apply is not yet implemented");
};
Sk.builtin.buffer = function buffer_() {
    throw new Sk.builtin.NotImplementedError("buffer is not yet implemented");
};
Sk.builtin.coerce = function coerce() {
    throw new Sk.builtin.NotImplementedError("coerce is not yet implemented");
};
Sk.builtin.intern = function intern() {
    throw new Sk.builtin.NotImplementedError("intern is not yet implemented");
};

/*
 Sk.builtinFiles = {};
 Sk.builtin.read = function read(x) {
 if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
 throw "File not found: '" + x + "'";
 return Sk.builtinFiles["files"][x];
 };
 Sk.builtinFiles = undefined;
 */
