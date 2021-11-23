

/* Constants used for kwargs */

// String constants
Sk.builtin.str.$empty = new Sk.builtin.str("");
Sk.builtin.str.$emptystr = Sk.builtin.str.$empty;

Sk.builtin.str.$default_factory = new Sk.builtin.str("default_factory");
Sk.builtin.str.$imag = new Sk.builtin.str("imag");
Sk.builtin.str.$real = new Sk.builtin.str("real");

Sk.builtin.str.$abs = new Sk.builtin.str("__abs__");
Sk.builtin.str.$call = new Sk.builtin.str("__call__");
Sk.builtin.str.$class = new Sk.builtin.str("__class__");
Sk.builtin.str.$cmp = new Sk.builtin.str("__cmp__");
Sk.builtin.str.$complex = new Sk.builtin.str("__complex__");
Sk.builtin.str.$contains = new Sk.builtin.str("__contains__");
Sk.builtin.str.$copy = new Sk.builtin.str("__copy__");
Sk.builtin.str.$dict = new Sk.builtin.str("__dict__");
Sk.builtin.str.$dir = new Sk.builtin.str("__dir__");
Sk.builtin.str.$doc = new Sk.builtin.str("__doc__");
Sk.builtin.str.$enter = new Sk.builtin.str("__enter__");
Sk.builtin.str.$eq = new Sk.builtin.str("__eq__");
Sk.builtin.str.$exit = new Sk.builtin.str("__exit__");
Sk.builtin.str.$index = new Sk.builtin.str("__index__");
Sk.builtin.str.$init = new Sk.builtin.str("__init__");
Sk.builtin.str.$int_ = new Sk.builtin.str("__int__");
Sk.builtin.str.$iter = new Sk.builtin.str("__iter__");
Sk.builtin.str.$float_ = new Sk.builtin.str("__float__");
Sk.builtin.str.$format = new Sk.builtin.str("__format__");
Sk.builtin.str.$ge = new Sk.builtin.str("__ge__");
Sk.builtin.str.$getattr = new Sk.builtin.str("__getattr__");
Sk.builtin.str.$getattribute = new Sk.builtin.str("__getattribute__");
Sk.builtin.str.$getitem = new Sk.builtin.str("__getitem__");
Sk.builtin.str.$class_getitem = new Sk.builtin.str("__class_getitem__");
Sk.builtin.str.$gt = new Sk.builtin.str("__gt__");
Sk.builtin.str.$le = new Sk.builtin.str("__le__");
Sk.builtin.str.$len = new Sk.builtin.str("__len__");
Sk.builtin.str.$lt = new Sk.builtin.str("__lt__");
Sk.builtin.str.$module = new Sk.builtin.str("__module__");
Sk.builtin.str.$name = new Sk.builtin.str("__name__");
Sk.builtin.str.$ne = new Sk.builtin.str("__ne__");
Sk.builtin.str.$new = new Sk.builtin.str("__new__");
Sk.builtin.str.$next = new Sk.builtin.str("__next__");
Sk.builtin.str.$path = new Sk.builtin.str("__path__");
Sk.builtin.str.$package = new Sk.builtin.str("__package__");
Sk.builtin.str.$repr = new Sk.builtin.str("__repr__");
Sk.builtin.str.$reversed = new Sk.builtin.str("__reversed__");
Sk.builtin.str.$round = new Sk.builtin.str("__round__");
Sk.builtin.str.$setattr = new Sk.builtin.str("__setattr__");
Sk.builtin.str.$setitem = new Sk.builtin.str("__setitem__");
Sk.builtin.str.$str = new Sk.builtin.str("__str__");
Sk.builtin.str.$trunc = new Sk.builtin.str("__trunc__");
Sk.builtin.str.$write = new Sk.builtin.str("write");
Sk.builtin.str.$sys = new Sk.builtin.str("sys");

Sk.misceval.op2method_ = {
    "Eq": Sk.builtin.str.$eq,
    "NotEq": Sk.builtin.str.$ne,
    "Gt": Sk.builtin.str.$gt,
    "GtE": Sk.builtin.str.$ge,
    "Lt": Sk.builtin.str.$lt,
    "LtE": Sk.builtin.str.$le
};

