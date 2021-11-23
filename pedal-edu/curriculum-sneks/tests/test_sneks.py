"""
Tests for checking that sneks specific functions are working.
"""

from curriculum_sneks.sneks import *
from curriculum_sneks.files import *

class Test:
    def test_only_printing_variables(self):
        with Execution('a,b=0,1\nprint(a,b)') as e:
            self.assertTrue(only_printing_variables())
        with Execution('print(0,"True", True)') as e:
            self.assertFalse(only_printing_variables())
        with Execution('print(True)') as e:
            self.assertFalse(only_printing_variables())


    def test_prevent_advanced_iteration(self):
        with Execution('while False:\n  pass') as e:
            prevent_advanced_iteration()
        self.assertEqual(e.final.message, "You should not use a <code>while</code> "
                                          "loop to solve this problem.")
        with Execution('sum([1,2,3])') as e:
            prevent_advanced_iteration()
        self.assertEqual(e.final.message, "You cannot use the builtin function "
                                          "<code>sum</code>.")

    def test_ensure_assignment(self):
        with Execution('a=0') as e:
            self.assertNotEqual(ensure_assignment("a", "Num"), False)
        with Execution('a=""') as e:
            self.assertNotEqual(ensure_assignment("a", "Str"), False)
        with Execution('a=True') as e:
            self.assertNotEqual(ensure_assignment("a", "Bool"), False)