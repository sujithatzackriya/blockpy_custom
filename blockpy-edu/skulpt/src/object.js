/**
 *
 * @constructor
 *
 * @description
 * Constructor for Python object. All Python classes (builtin and user-defined)
 * should inherit from this class.
 *
 */
Sk.builtin.object = function object() {
    Sk.asserts.assert(this instanceof Sk.builtin.object, "bad call to object, use 'new'");
};

Object.defineProperties(Sk.builtin.object.prototype, /**@lends {Sk.builtin.object.prototype}*/ {
    ob$type: { value: Sk.builtin.object, writable: true },
    tp$name: { value: "object", writable: true },
    tp$base: { value: undefined, writable: true },
    sk$object: { value: true },
});

/**
 * @description
 * We aim to match python and javascript inheritance like
 * type   instanceof object => true
 * object instanceof type   => true
 * type   instanceof type   => true
 * object instanceof object => true
 *
 * type   subclassof object => type.prototype   instanceof object => true
 * object subclassof type   => object.prototype instanceof type   => false
 * 
 * this algorithm achieves the equivalent with the following prototypical chains
 * using `Object.setPrototypeOf`
 *
 * ```
 * type.__proto__             = type   (type instanceof type)
 * type.__proto__.__proto__   = object (type instanceof object)
 * type.prototype.__proto__   = object (type subclasssof object)
 * object.__proto__           = type   (object instanceof type)
 * object.__proto__.__proto__ = object (object instanceof object)
 * ```
 *
 * while `Object.setPrototypeOf` is not considered [good practice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)
 * this is a particularly unique use case and creates a lot of prototypical benefits
 * all single inheritance classes (i.e. all builtins) now follow prototypical inheritance
 * similarly it makes metclasses that much easier to implement
 * Object.setPrototypeOf is also a feature built into the javascript language
 *
 * @ignore
 */
(function setUpBaseInheritance () {
    Object.setPrototypeOf(Sk.builtin.type.prototype, Sk.builtin.object.prototype);
    Object.setPrototypeOf(Sk.builtin.type, Sk.builtin.type.prototype);
    Object.setPrototypeOf(Sk.builtin.object, Sk.builtin.type.prototype);
    Sk.abstr.setUpBuiltinMro(Sk.builtin.type);
    Sk.abstr.setUpBuiltinMro(Sk.builtin.object);
})();


/**
 * worth noting that we don't use the new api for object since descr_objects are not yet initialized
 * object, type, NoneType, NotImplemented,
 * slot_wrapper, methods_descriptor, getsets_desciptor, class_descriptor
 * will be fully initialized in the import.js doOneTimeInitialization
 * @ignore
 */

Sk.builtin.object.prototype.tp$doc = "The most base type";

Sk.builtin.object.prototype.tp$new = function (args, kwargs) {
    // see cypthon object_new for algorithm details we do two versions one for prototypical and one for not
    if (args.length || (kwargs && kwargs.length)) {
        if (this.tp$new !== Sk.builtin.object.prototype.tp$new) {
            throw new Sk.builtin.TypeError("object.__new__() takes exactly one argument (the type to instantiate)");
        }
        if (this.tp$init === Sk.builtin.object.prototype.tp$init) {
            throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + "() takes no arguments");
        }
    }
    return new this.constructor();
};

/**
 * @param {Array} args 
 * @param {Array=} kwargs 
 * @ignore
 */
Sk.builtin.object.prototype.tp$init = function (args, kwargs) {
    // see cypthon object_init for algorithm details
    if (args.length || (kwargs && kwargs.length)) {
        if (this.tp$init !== Sk.builtin.object.prototype.tp$init) {
            throw new Sk.builtin.TypeError("object.__init__() takes exactly one argument (the instance to initialize)");
        }
        if (this.tp$new === Sk.builtin.object.prototype.tp$new) {
            throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + ".__init__() takes exactly one argument (the instance to initialize)");
        }
    }
    return Sk.builtin.none.none$;
};

Sk.builtin.object.prototype.tp$getattr = Sk.generic.getAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.generic.setAttr;

Sk.builtin.object.prototype.$r = function () {
    const mod = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$module);
    let cname = "";
    if (mod && Sk.builtin.checkString(mod)) {
        cname = mod.v + ".";
    }
    return new Sk.builtin.str("<" + cname + Sk.abstr.typeName(this) + " object>");
};

Sk.builtin.object.prototype.tp$str = function () {
    // if we're calling this function then the object has no __str__ or tp$str defined
    return this.$r();
};

/**
 * Return the hash value of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The hash value
 * @ignore
 */
Sk.builtin.object.prototype.tp$hash = function () {
    if (!this.$savedHash_) {
        this.$savedHash_ = new Sk.builtin.int_(Sk.builtin.hashCount++);
    }
    return this.$savedHash_;
};

Sk.builtin.object.prototype.tp$richcompare = function (other, op) {
    let res;
    switch (op) {
        case "Eq":
            res = this === other || Sk.builtin.NotImplemented.NotImplemented$;
            break;
        case "NotEq":
            // use tp$richcompare here... because CPython does. ob$eq breaks some tests for NotEq subclasses
            res = this.tp$richcompare(other, "Eq");
            if (res !== Sk.builtin.NotImplemented.NotImplemented$) {
                res = !Sk.misceval.isTrue(res);
            }
            break;
        default:
            res = Sk.builtin.NotImplemented.NotImplemented$;
    }
    return res;
};

Sk.builtin.object.prototype.tp$getsets = {
    __class__: {
        $get: function () {
            return this.ob$type;
        },
        $set: function (value) {
            if (!Sk.builtin.checkClass(value)) {
                throw new Sk.builtin.TypeError("__class__ must be set to a class, not '" + Sk.abstr.typeName(value) + "' object");
            }
            if (!this.hp$type || !value.sk$klass) {
                throw new Sk.builtin.TypeError(" __class__ assignment only supported for heap types or ModuleType subclasses");
            }
            Object.setPrototypeOf(this, value.prototype);
            return;
        },
        $doc: "the object's class",
    },
};

Sk.builtin.object.prototype.tp$methods = {
    __dir__: {
        $meth: function __dir__() {
            let dir = [];
            if (this.$d) {
                if (this.$d instanceof Sk.builtin.dict) {
                    dir = this.$d.sk$asarray();
                } else {
                    for (let key in this.$d) {
                        dir.push(new Sk.builtin.str(key));
                    }
                }
            }
            // here we use the type.__dir__ implementation
            const type_dir = Sk.misceval.callsimArray(Sk.builtin.type.prototype.__dir__, [this.ob$type]);
            // put the dict keys before the prototype keys
            dir.push(...type_dir.v);
            type_dir.v = dir;
            return type_dir;
        },
        $flags: {NoArgs: true},
        $doc: "Default dir() implementation.",
    },
    __format__: {
        $meth: function (format_spec) {
            let formatstr;
            if (!Sk.builtin.checkString(format_spec)) {
                if (Sk.__future__.exceptions) {
                    throw new Sk.builtin.TypeError("format() argument 2 must be str, not " + Sk.abstr.typeName(format_spec));
                } else {
                    throw new Sk.builtin.TypeError("format expects arg 2 to be string or unicode, not " + Sk.abstr.typeName(format_spec));
                }
            } else {
                formatstr = Sk.ffi.remapToJs(format_spec);
                if (formatstr !== "") {
                    throw new Sk.builtin.NotImplementedError("format spec is not yet implemented");
                }
            }
            return this.tp$str();
        },
        $flags: {OneArg: true},
        $doc: "Default object formatter.",
    },
};

Sk.builtin.hashCount = 1;
Sk.builtin.idCount = 1;

/**
 * @constructor
 * Sk.builtin.none
 * @extends {Sk.builtin.object}
 *
 * @description
 * It would be rare to call this as a constructor since it returns {@link Sk.builtin.none.none$}
 */
Sk.builtin.none = function () {
    return Sk.builtin.none.none$; // always return the same object
};
Sk.abstr.setUpInheritance("NoneType", Sk.builtin.none, Sk.builtin.object);

Sk.builtin.none.prototype.$r = function () {
    return new Sk.builtin.str("None");
};

Sk.builtin.none.prototype.tp$hash = function () {
    return new Sk.builtin.int_(0);
};

Sk.builtin.none.prototype.tp$new = function (args, kwargs) {
    Sk.abstr.checkNoArgs("NoneType", args, kwargs);
    return Sk.builtin.none.none$;
};

/**
 * Python None value.
 * @type {Sk.builtin.none}
 * @member {Sk.builtin.none}
 * @suppress {checkTypes}
 */
Sk.builtin.none.none$ = Object.create(Sk.builtin.none.prototype, {
    v: {value: null, enumerable: true},
});

/**
 * @constructor
 * Sk.builtin.NotImplemented
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.NotImplemented = function () {
    return Sk.builtin.NotImplemented.NotImplemented$; // always return the same object
};
Sk.abstr.setUpInheritance("NotImplementedType", Sk.builtin.NotImplemented, Sk.builtin.object);

Sk.builtin.NotImplemented.prototype.$r = function () {
    return new Sk.builtin.str("NotImplemented");
};

Sk.builtin.NotImplemented.prototype.tp$new = function (args, kwargs) {
    Sk.abstr.checkNoArgs("NotImplementedType", args, kwargs);
    return Sk.builtin.NotImplemented.NotImplemented$;
};
/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 * @member {Sk.builtin.NotImplemented}
 * @suppress {checkTypes}
 */
Sk.builtin.NotImplemented.NotImplemented$ = Object.create(Sk.builtin.NotImplemented.prototype, {
    v: {value: null, enumerable: true},
});

Sk.exportSymbol("Sk.builtin.none", Sk.builtin.none);
Sk.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);
