from pedal.tifa.tifa import Tifa
import sys
import unittest

unit_tests = {
    # Source Code, Shouldn't catch this, Should catch this
    'builtin_True': ['print(True)', ['Initialization Problem'], []],
    'unread_variable': ['a = 0', [], ['Unused Variable']],
    'undefined_variable': ['print(a)', [], ['Initialization Problem']],
    'defined_read_variable': ['a = 0\nprint(a)', ['Initialization Problem'], []],
    'overwritten_variable': ['a = 0\na = 5', [], ['Overwritten Variable']],
    'unread_variables': ['a = 0\nb = 5', ['Overwritten Variable'], ['Unused Variable']],
    'wrwr_variable': ['a = [1]\nprint(a)\na = [1]\nprint(a)', [], []],
    # Unconnected blocks
    'unconnected_assign': ['a = ___', [], ['Unconnected blocks']],
    'unconnected_print': ['print(___)', [], ['Unconnected blocks']],
    
    'literal_in_call': ['print("dog" in input("test"))', [], []],
    'wrong_method_for_type': ['[].replace(",","")', [], []],
    
    # Double call
    'double_call': ['def x(a):\n    return a\nx(5)\nx(3)', ['Read out of scope'], []],
    
    # Chained functions
    'chained_functions': ['def x():\n    return 0\ndef y():\n    x()\ny()', ['Read out of scope', 'Initialization Problem'], []],
    
    # String indexing and slicing
    'string_indexing_slicing': ['("a"[0] + ""[:])[:][0]', ['Incompatible types'], []],
    # List indexing and slicing
    'list_indexing_slicing': ['([0][0] + [1,2,3][:][2])', ['Incompatible types'], []],
    
    'returned_string': 
        ['def pluralize(a_word):\n    return a_word+"s"\nnoun = pluralize("Dog")\nprint(noun + " can pet other " + noun)', ['Incompatible types'], []],
    'update_without_read': 
        ['a = 0\na+= 1', ['Initialization Problem'], ['Unused Variable']],
    'update_and_read': 
        ['a = 0\na+= 1\nprint(a)', ['Initialization Problem', 'Unused Variable'], []],
    'iterate_through_non_existing_list': 
        ['for x in y:\n\tpass', ['Unused Variable'], ['Initialization Problem']],
    'iterate_through_list':
        ['y = [1,2,3]\nfor x in y:\n\tpass', ['Unused Variable', 'Initialization Problem'], []],
    'iterate_through_empty_list':
        ['y = []\nfor x in y:\n\tpass', ['Unused Variable', 'Initialization Problem'], ['Iterating over empty list']],
    'double_iterate_through_strings':
        ['ss = ["Testing", "Here"]\nfor a in ss:\n    print(a)\nfor b in a:\n    print(b)', ['Iterating over Non-list', 'Iterating over empty list'], []],
    'iterate_through_number':
        ['y = 5\nfor x in y:\n\tpass', ['Unused Variable', 'Initialization Problem'], ['Iterating over Non-list']],
    'iterate_over_iteration_variable':
        ['y = [1,2,3]\nfor y in y:\n\tpass', [], ['Iteration Problem']],
    'type_change':
        ['a = 0\nprint(a)\na="T"\nprint(a)', [], ['Type changes']],
    'defined_in_if_root_but_not_other':
        ['if True:\n\ta = 0\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_in_both_branches':
        ['if True:\n\ta = 0\nelse:\n\ta = 1\nprint(a)', ['Possible Initialization Problem'], []],
    'defined_in_else_root_but_not_other':
        ['if True:\n\tpass\nelse:\n\ta = 1\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_in_if_branch_but_others':
        ['if True:\n\tif False:\n\t\ta = 0\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_before_if_branch_but_not_others':
        ['if True:\n\ta = 0\nif False:\t\tpass\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_after_if_branch_but_not_others':
        ['if True:\n\tif False:\n\t\tpass\n\ta = 0\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_within_both_if_branches_but_not_others':
        ['if True:\n\tif False:\n\t\ta=0\n\telse:\n\t\ta = 0\nprint(a)', [], ['Possible Initialization Problem']],
    'defined_in_all_branches':
        ['if True:\n\tif False:\n\t\ta=0\n\telse:\n\t\ta = 0\nelse:\n\ta=3\nprint(a)', ['Possible Initialization Problem'], []],
    'read_in_if_branch_but_unset':
        ['if True:\n\tprint(a)', [], ['Initialization Problem']],
    'read_in_else_branch_but_unset':
        ['if True:\n\tpass\nelse:\n\tprint(a)', [], ['Initialization Problem']],
    'read_in_both_branches_but_unset':
        ['if True:\n\tprint(a)\nelse:\n\tprint(a)', [], ['Initialization Problem']],
    'overwritten_in_both_branches':
        ['a = 0\nif True:\n\ta = 0\nelse:\n\ta = 1', [], ['Overwritten Variable']],
    'overwritten_in_one_branch':
        ['a = 0\nif True:\n\tpass\nelse:\n\ta = 1', ['Overwritten Variable'], []],
    'overwritten_in_inner_branch':
        ['a = 0\nif True:\n\tif False:\n\t\ta = 0\nelse:\n\ta = 1', ['Overwritten Variable'], []],
    'overwritten_in_all_branch':
        ['a = 0\nif True:\n\tif False:\n\t\ta = 0\n\telse:\n\t\ta = 2\nelse:\n\ta = 1', [], ['Overwritten Variable']],
    'overwritten_in_all_branches2':
        ['a = 0\nif True:\n\tprint(a)\n\tif False:\n\t\ta = 0\n\telse:\n\t\ta = 2\nelse:\n\ta = 1', ['Overwritten Variable'], []],
    
    # Iterating over the result of a builtin
    'print_range':
        ['x = range(100)\nprint(x)', ['Iterating over Non-list'], []],
    'iterate_range':
        ['x = range(100)\nfor y in x:\n    print(y)', ['Iterating over Non-list'], []],
    'iterate_over_ranges_atomic_subtype':
        ['x = range(100)\nfor y in x:\n    pass\nfor z in y:\n    print(z)', [], ['Iterating over Non-list']],
    'iterate_over_split':
        ['for x in "a,b,c".split(","):\n  x+""', ['Iterating over Non-list', 'Iterating over empty list'], []],
    'iterate_over_string_upper':
        ['for l in "abc".upper():\n  l+""', ['Iterating over Non-list', 'Iterating over empty list'], []],
    
    # Incompatible types
    'add_int_str':
        ['a = 5 + "ERROR"', [], ['Incompatible types']],
    'multiply_str_int':
        ['a = "ERROR" * 5', ['Incompatible types'], []],
    'simple_unary_op':
        ['+1', ['Incompatible types'], []],
    'unary_compare':
        ['-1 < 5', ['Incompatible types'], []],
    'unary_and_sub_int_int':
        ['-(5)+0', ['Incompatible types'], []],
    'iadd_int_int':
        ['a=0\na+=5\na', ['Incompatible types', 'Unused Variable', 'Initialization Problem', 'Overwritten Variable'], []],
    'iadd_str_int':
        ['a=""\na+=5\na', ['Unused Variable', 'Initialization Problem', 'Overwritten Variable'], ['Incompatible types']],
    'iadd_undefined':
        ['a+=5\na', ['Unused Variable', 'Overwritten Variable'], ['Initialization Problem']],
    'iadd_unread':
        ['a=0\na+=5', ['Initialization Problem', 'Overwritten Variable'], ['Unused Variable']],
    
    # Lambda
    'simple_lambda':
        ['lambda: 0', [], []],
    'lambda_add':
        ['a = lambda: 0\nb=a()\nb+5', ['Incompatible types'], []],
    
    # Handle function definitions
    'uncalled_function':
        ['def named(x):\n\tprint(x)\n', ['Initialization Problem'], ['Unused Variable']],
    'called_int_function':
        ['def int_func(x):\n\treturn 5\nint_func(10)', [], []],
    'called_constant_function':
        ['def x():\n    return 4\nx()', ['Unused Variable'], []],
    # Actions after returning
    'return_after_return':
        ['def x():\n    return 5\n    return 4\nx()', [], ['Action after return']],
    'action_after_return_on_both_branches':
        ['def x():\n  if True:\n    return 4\n  else:\n    return 3\n  a = 0\n  print(a)\nx()', [], ['Action after return']],
    # Function with subtypes
    'function_with_subtypes_add_int_list_int':
        ['def add_first(a_list):\n    for element in a_list:\n        return element + 5\nprint(add_first([1]))', ['Incompatible types'], []],
    'function_with_subtypes_add_int_list_str':
        ['def add_first(a_list):\n    for element in a_list:\n        return element + 5\nprint(add_first(["1"]))', [], ['Incompatible types']],
    'function_with_subtypes_add_int_primitive_int':
        ['def add_first(a_list):\n    for element in a_list:\n        return element + 5\nprint(add_first(1))', [], ['Iterating over Non-list']],
    'function_with_subtypes_add_int_primitive_str':
        ['def add_first(a_list):\n    for element in a_list:\n        return element + 5\nprint(add_first("1"))', [], ['Incompatible types']],
    # Out of scope
    'read_out_of_scope': 
        ['def x(parameter):\n    return parameter\nx(0)\nparameter', [], ['Read out of scope']],
    'read_inside_of_scope': 
        ['def x(parameter):\n    return parameter\nx(0)', ['Read out of scope'], []],
    'read_not_out_of_scope':
        ['def x():\n    if 1:\n        y=0\n    else:\n        y=1\n    y\nx()\nx()', ['Read out of scope'], []],
    
    'append_to_empty_list':
        ['a = []\na.append(1)\nprint(a)', ['Initialization Problem', 'Unused Variable'], []],
    'append_to_non_empty_list':
        ['a = [1]\na.append(1)\nprint(a)', ['Initialization Problem', 'Unused Variable'], []],
    'append_to_undefined':
        ['a.append(1)\nprint(a)', ['Unused Variable'], ['Initialization Problem']],
    'append_to_unread':
        ['a=[]\na.append(1)', ['Initialization Problem'], ['Unused Variable']],
    'append_to_number':
        ['a=1\na.append(1)\nprint(a)', [], ['Append to non-list']],
    
    'append_and_index':
        ['x=[]\nx.append(1)\nx[0]+1', ['Incompatible types'], []],
    'indexing_used':
        ['mag1 = 0\nmercalli = [0]\nmag1 = mercalli[mag1]\nmag1', ['Initialization Problem', 'Unused Variable', 'Overwritten Variable'], []],
    
    'created_list_but_unread':
        ['old = [1,2,3]\nnew=[]\nfor x in old:\n\tnew.append(x)', [], ['Unused Variable']],
    'created_list_but_undefined':
        ['old = [1,2,3]\nfor x in old:\n\tnew.append(x)\nprint(new)', [], ['Initialization Problem']],
    
    'builtin_float_converter': 
        ['a = float(5)\nb = "test"\nprint(a+b)', [], ['Incompatible types']],
    
    # Double iteration
    'iterate_over_list_of_tuples':
        ['for x,y in [(1,2), (3,4)]:\n    x, y', ['Initialization Problem'], []],
    'iterate_over_items':
        ['record = {"A": 5, "B": 6}\nfor x,y in record.items():\n    x, y', ['Initialization Problem'], []],
    'iterate_over_items_add':
        ['record = {"A": 5, "B": 6}\nfor x,y in record.items():\n    x+"", y+0', ['Initialization Problem', "Incompatible types"], []],
    
    # Tuple, Multiple Assignment
    'multiple_assignment': ['a,b = 1,2\n1+a\nb', ['Incompatible types'], []],
    'tuple_index': ['tuple_box = (6, 8, 4)\nprint(tuple_box[0])', [], []],
    
    # Sets
    'set_creation': ['a = set([1,2,3])\nprint(a)', ['Initialization Problem'], []],
    
    # Dictionaries
    'set_key_in_dict': ['a = {}\na[1] = 0', [], []],
    'use_key_in_dict': ['a = {"x": 5, "y": "T"}\na["x"]+5', ['Incompatible types'], []],
    'use_key_in_lod': ['x=[{"a": 0, "b": True}, {"a": 1, "b": False}]\ny=x[0]\nz=y["a"]+0', ['Incompatible types'], []],
    'use_chained_key_in_lod': ['x=[{"a": 0, "b": True}, {"a": 1, "b": False}]\nnot x[1]["b"]', ['Incompatible types'], []],
    'iterate_over_lod': ['ls=[{"a": 0, "b": True}, {"a": 1, "b": False}]\nfor x in ls:\n    x["a"]+0', ['Incompatible types'], []],
    # TODO: Add stronger assertion this one, it shouldn't be a good one
    'incorrect_dict_iteration': ['dict = {"T": "V"}\nfor key,value in dict:\n    print(key)', [], []],
    'incorrect_dict_iteration2': ['dict = {"T": 0}\nfor i in dict:\n print(i, dict[i])', [], []],
    
    # While
        'while_until_input': ['user = input("Give a word.")\nwhile user:\n    print(user)\n    user = input("Give another word.")', ['Unused Variable'], []],
     
    # With
    'with_open':
        ['with open("A") as a:\n    print(a)', ['Initialization Problem'], []],
    
    # List comprehensions
    'simple_comprehension':
        ['[0 for y in range(100)]',[], []],
    'list_comprehension':
        ['a = [5 for x in range(100)]\nfor i in a:\n    5+i', ['Iterating over Non-list', 'Incompatible types'], []],
    
    # Return outside function
    'no_return_outside_function':
        ['def x():\n    return 5\nx()', ['Return outside function'], []],
    'return_outside_function':
        ['def x():\n    pass\nreturn 5\nx()', [], ['Return outside function']],
    
    # Classes
    'class_definition':
        ['class A:\n    y = 0\n    def __init__(self, x):\n        self.x = 0\n        self.test()\n    def test(self):\n        self.x = 5\nA()', [], []],
    
    # Mutable Types
    'mutable_list_in_function':
        ['def t():\n    x = []\n    x.append(1)\n    return x\nfor x in t():\n    x + 1', ['Incompatible types'], []],
    # Importing
    'import_matplotlib':
        ['import matplotlib.pyplot as plt\nplt.hist([1,2,3])\nplt.show()', ['Initialization Problem'], []],
    'import_random':
        ['from random import randint\na=randint(1,2)\n1+a', ['Initialization Problem', 'Incompatible types'], []],
    
    'import_state_demographics':
        ["import state_demographics\n\n\nincome_list = state_demographics.get(\"Per Capita Income\",\"(None)\",'')\nfilter_income = []\nfor income in income_list:\n    if income > 28000:\n        income_list.append(filter_income)\nprint(filter_income)\n", [], []],
    'import_state_demographics2':
        ["import state_demographics\n\n\nincome_list = state_demographics.get(\"Per Capita Income\",\"(None)\",'')\nnew_income_list = 0\nfor income in income_list:\n    if income > 28000:\n        new_income_list = new_income_list + 1\nprint(new_income_list)\n", [], []],
    'filter_pattern':
        ['l = []\nfor x in l:\n    if x > 0:\n        x', [], []],
    'append_iter_var_to_list':
        ['x = []\nx.append(x)\nx', [], []],
    'function_with_parameter':
        ['def x(y):\n    y\nx()', [], []],
    'function_returns_None':
        ['def x():\n    return\nx()', [], []],
    'mutually_recursive_call':
        ['def y():\n    x()\ndef x():\n    y()\nx()', [], ['Recursive Call']],
    'recursive_call':
        ['def x():\n    x()\nx()', [], ['Recursive Call']],
    'overwritten_double_nested_branch':
        ['b= 0\nif True:\n    if True:\n        b=0\nb', ['Possible Initialization Problem'], []],
    # Overwritten in one branches
    'overwritten_in_one_branch':
        ['a = 0\nif True:\n\ta = 1\na', ['Possible Initialization Problem'], []],
    'filter_pattern2':
        ["t = 0\nfor x in []:\n    if x:\n        t = t + 1\nprint(t)", ['Possible Initialization Problem'], []],
    'read_out_scope2':
        ["x = ''\ndef y():\n    return x\ny()", ['Unused Variable'], []],
    
    'read_out_scope_double_branch':
        ["def x():\n  if True:\n    y=0\n  else:\n    y=1\n  y\nx()", 
        ['Unused Variable', 'Read out of scope'], []],
    
    # Calling functions from within functions
    'call_function_within_function':
        ['def z():\n     return b\ndef y():\n    b = 0\n    z()\n    return b\ndef x():\n    y()\nx()', ['Unused Variable'], ['Read out of scope']],
    
    # While loop with possibly unused body
    'while_body_and_conditional_uses_variable':
        ['a = 10\nwhile a:\n    a -= 1', ['Unused Variable'], []],
    'while_body_uses_variable':
        ['a = 10\nwhile True:\n    a -= 1', [], ['Unused Variable']],
    'while_body_possibly_defines_variable':
        ['while True:\n    a=0\na', [], ['Possible Initialization Problem']],
    'while_body_defined_variable':
        ['a=0\nwhile True:\n    a=0\na', ['Possible Initialization Problem'], []],
    
    # Generators
    'add_list_to_list_comprehension':
        ['[1]+[a for a in [1,2,3]]', ['Unused Variable', "Incompatible types"], []],
    'add_set_to_set_comprehension':
        ['{4}+{a for a in [1,2,3]}', ['Unused Variable', "Incompatible types"], []],
    'int_membership_in_dictionary':
        ['3 in {a:a for a in [1,2,3]}', ['Unused Variable', "Incompatible types"], []],
    'int_membership_in_comprehension':
        ['4 in (a for a in [1,2,3])', ['Unused Variable', "Incompatible types"], []],
    
    'prevent_empty_iteration_in_appended_list':
        ['eles = [1,2,3]\nx = []\nfor ele in eles:\n    x.append(ele)\nfor e2 in x:\n    e2+1', 
            ['Iterating over empty list'], []],
            
    'prevent_empty_iteration_dict':
        ['x={"A":5}\nfor y in x:\n y', ['Iterating over empty list'], []],
    
    # Built-in modules
    'import_string_letters':
        ['import string\nstring.letters+""', ['Incompatible types'], []]
}

class TestCode(unittest.TestCase):
    pass

SILENCE_EXCEPT = None
class o:
    def fail(s, message):
        print(message)
self = o()

def make_tester(name, code, nones, somes):
    def test_code(self):
        tifa = Tifa(False)
        try:
            tifa.process_code(code)
        except Exception as e:
            raise type(e)(str(e) +
                      ' in code:\n%s' % code)
        if not tifa.report['tifa']['success']:
            self.fail(name+": Error message in\n"+code+"\n"+str(tifa.report['tifa']['error']))
        for none in nones:
            if tifa.report['tifa']['issues'].get(none, []):
                self.fail(name+": Incorrectly detected "+none+"\n"+code+"\n")
        for some in somes:
            if not tifa.report['tifa']['issues'].get(some, []):
                print(name+"Test")
                self.fail(name+": Failed to detect "+some+"\n"+code+"\n")
    return test_code
for name, (code, nones, somes) in unit_tests.items():
    if SILENCE_EXCEPT is None or SILENCE_EXCEPT == name:
        #setattr(TestCode, 'test_code_{:02}'.format(i), make_tester(code, nones, somes))
        make_tester(name, code, nones, somes)(self)

#if __name__ == '__main__':
    #unittest.main()
tifa = Tifa(False)
tifa.process_code('''
a = 0
for y in [1,2,3]:
    print(a + y)
with open("lacrimosa.txt") as inp:
    for line in inp:
        print(line.strip())
''')
print(tifa.report)