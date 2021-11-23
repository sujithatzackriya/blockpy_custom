
from pedal.assertions.static import *

from tests.execution_helper import Execution, ExecutionTestCase, SUCCESS_MESSAGE


class TestAssertions(ExecutionTestCase):
    def test_prevent_function_usage(self):
        with Execution('sum([1,2,3])') as e:
            self.assertTrue(prevent_function_call('sum'))
        self.assertFeedback(e, "May Not Use Function\n"
                               "You used the function sum on line 1. "
                               "You may not use that function.")

        with Execution('max([1,2,3])') as e:
            self.assertFalse(prevent_function_call('sum'))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_prevent_operator_used(self):
        with Execution('2+3') as e:
            self.assertTrue(prevent_operation('+'))
        self.assertFeedback(e, "May Not Use Operator\n"
                               "You used the operator + on line 1. "
                               "You may not use that operator.")

    def test_prevent_operator_not_used(self):
        with Execution('+3') as e:
            self.assertFalse(prevent_function_call('+'))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_prevent_operator_below_limit(self):
        with Execution('1+3-4') as e:
            self.assertFalse(prevent_function_call('+', at_most=2))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_prevent_operator_above_limit(self):
        with Execution('2+3+4\n1+2') as e:
            self.assertTrue(prevent_operation('+', at_most=2))
        self.assertFeedback(e, "May Not Use Operator\n"
                               "You used the operator + on line 2. "
                               "You may not use that operator more than "
                               "2 times, but you used it 3 times.")

    def test_ensure_operator_above_limit(self):
        with Execution('2+3+4\n1+2') as e:
            self.assertTrue(ensure_operation('+', at_least=5))
        self.assertFeedback(e, "Must Use Operator\n"
                               "You must use the operator + at least "
                               "5 times, but you used it 3 times.")

    def test_prevent_muted(self):
        with Execution('sum([1,2,3])') as e:
            self.assertTrue(prevent_function_call('sum', muted=True))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_prevent_literal_used_int(self):
        with Execution('a = 5\na') as e:
            self.assertTrue(prevent_literal(5))
        self.assertFeedback(e, "May Not Use Literal Value\n"
                               "You used the literal value 5 on line 1. "
                               "You may not use that value.")

    def test_prevent_literal_used_str(self):
        with Execution('print("Hello")') as e:
            self.assertTrue(prevent_literal("Hello"))
        self.assertFeedback(e, "May Not Use Literal Value\n"
                               "You used the literal value 'Hello' on line 1."
                               " You may not use that value.")

    def test_prevent_literal_unused(self):
        with Execution('print("Hello", 5)') as e:
            self.assertFalse(prevent_literal("Fire"))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_prevent_literal_used_negative_int(self):
        with Execution('a = -1+2\na') as e:
            self.assertTrue(prevent_literal(-1))
        self.assertFeedback(e, "May Not Use Literal Value\n"
                               "You used the literal value -1 on line 1. "
                               "You may not use that value.")

    def test_prevent_literal_used_boolean(self):
        with Execution('a = True\na') as e:
            self.assertTrue(prevent_literal(True))
        self.assertFeedback(e, "May Not Use Literal Value\n"
                               "You used the literal value True on line 1. "
                               "You may not use that value.")

    def test_ensure_literal_used_int(self):
        with Execution('a = 6\na') as e:
            self.assertTrue(ensure_literal(5))
        self.assertFeedback(e, "Must Use Literal Value\n"
                               "You must use the literal value 5.")

    def test_ensure_literal_used_str(self):
        with Execution('print("Helo")') as e:
            self.assertTrue(ensure_literal("Hello"))
        self.assertFeedback(e, "Must Use Literal Value\n"
                               "You must use the literal value 'Hello'.")

    def test_ensure_literal_unused(self):
        with Execution('print("Hello", 5)') as e:
            self.assertFalse(ensure_literal("Hello"))
        self.assertFeedback(e, SUCCESS_MESSAGE)

    def test_ensure_literal_used_negative_int(self):
        with Execution('a = -15+2\na') as e:
            self.assertTrue(ensure_literal(-1))
        self.assertFeedback(e, "Must Use Literal Value\n"
                               "You must use the literal value -1.")

    def test_ensure_literal_used_boolean(self):
        with Execution('a = False\na') as e:
            self.assertTrue(ensure_literal(True))
        self.assertFeedback(e, "Must Use Literal Value\n"
                               "You must use the literal value True.")