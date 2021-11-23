import unittest
import os
import sys
from textwrap import dedent

from pedal.assertions.static import prevent_operation, ensure_operation, function_prints
from pedal.cait.find_node import find_operation, find_prior_initializations, find_function_calls, is_top_level, \
    function_is_called
from pedal.core.commands import suppress
from pedal.core.feedback import Feedback
from pedal.core.report import MAIN_REPORT
from pedal.toolkit.records import check_record_instance

pedal_library = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, pedal_library)

here = "" if os.path.basename(os.getcwd()) == "tests" else "tests/"

from pedal.core import *
from pedal.source import set_source

from pedal.cait.cait_api import parse_program
from pedal.sandbox.sandbox import Sandbox
from pedal.toolkit.files import files_not_handled_correctly
from pedal.toolkit.functions import (match_signature, output_test, unit_test,
                                     check_coverage, match_parameters)
from pedal.toolkit.signatures import (function_signature)
from pedal.toolkit.imports import ensure_imports
from pedal.toolkit.printing import ensure_prints
from pedal.extensions.plotting import check_for_plot, prevent_incorrect_plt
from tests.execution_helper import Execution, ExecutionTestCase



class TestImports(unittest.TestCase):
    def test_ensure_imports(self):
        with Execution('json = "0"\njson.loads("0")+0') as e:
            self.assertTrue(ensure_imports("json"))
        self.assertEqual(e.final.message, "You need to import the <code>json</code> "
                                          "module.")
        with Execution('from requests import json\njson.loads("0")+0') as e:
            self.assertTrue(ensure_imports("json"))
        self.assertEqual(e.final.message, "You need to import the <code>json</code> "
                                          "module.")
        with Execution('import json\njson.loads("0")+0') as e:
            self.assertFalse(ensure_imports("json"))
        self.assertEqual(e.final.message, "No errors reported.")
        with Execution('from json import loads\nloads("0")+0') as e:
            self.assertFalse(ensure_imports("json"))
        self.assertEqual(e.final.message, "No errors reported.")


class TestPrints(unittest.TestCase):
    def test_ensure_prints(self):
        with Execution('print(1)\nprint(2)') as e:
            self.assertFalse(ensure_prints(1))
        self.assertEqual(e.final.message, "You are printing too many times!")
        with Execution('print(1)\nprint(2)') as e:
            self.assertFalse(ensure_prints(3))
        self.assertEqual(e.final.message, "You are not printing enough things!")
        with Execution('a = 0\na') as e:
            self.assertFalse(ensure_prints(1))
        self.assertEqual(e.final.message, "You are not using the print function!")
        with Execution('def x():\n  print(x)\nx()') as e:
            self.assertFalse(ensure_prints(1))
        self.assertEqual(e.final.message, "You have a print function that is not at "
                                          "the top level. That is incorrect for "
                                          "this problem!")
        with Execution('print(1)\nprint(2)') as e:
            prints = ensure_prints(2)
            self.assertNotEqual(prints, False)
            self.assertEqual(len(prints), 2)
        self.assertEqual(e.final.message, "No errors reported.")


class TestPlots(unittest.TestCase):
    def test_check_for_plot(self):
        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.hist([1,2,3])
            plt.title("My line plot")
            plt.show()
            plt.plot([4,5,6])
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('hist', [1, 2, 3]), False)
        self.assertEqual(e.final.message, "No errors reported.")

        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('hist', [1, 2, 3, 4]),
                             "You have created a histogram, but it does not "
                             "have the right data.<br><br><i>(wrong_plt_data)<i></br></br>")

        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('line', [4, 5, 6]), False)
        self.assertEqual(e.final.message, "No errors reported.")

        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('line', [4, 5, 6, 7]),
                             "You have created a line plot, but it does not "
                             "have the right data.<br><br><i>(wrong_plt_data)<i></br></br>")

        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.plot([1,2,3])
            plt.title("My line plot")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('hist', [1, 2, 3]),
                             "You have plotted the right data, but you appear "
                             "to have not plotted it as a histogram.<br><br><i>(wrong_plt_type)<i></br></br>")

        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.plot([1,2,3])
            plt.title("Wrong graph with the right data")
            plt.show()
            plt.hist([4,5,6])
            plt.title("Right graph with the wrong data")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('hist', [1, 2, 3]),
                             "You have created a histogram, but it does not "
                             "have the right data. That data appears to have "
                             "been plotted in another graph.<br><br><i>(other_plt)<i></br></br>")

        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.plot([1,2,3])
            plt.title("My line plot")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('hist', [4, 5, 6]),
                             "You have not created a histogram with the "
                             "proper data.<br><br><i>(no_plt)<i></br></br>")

        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.scatter([], [])
            plt.title("Nothingness and despair")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('scatter', []), False)

        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.scatter([1,2,3], [4,5,6])
            plt.title("Some actual stuff")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(check_for_plot('scatter', [[1, 2, 3], [4, 5, 6]]),
                             False)

    def test_prevent_incorrect_plt(self):
        student_code = dedent('''
            import matplotlib.pyplot
            plt.scatter([1,2,3], [4,5,6])
            plt.title("Some actual stuff")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(prevent_incorrect_plt(), True)
        self.assertEqual(e.final.message, "You have imported the "
                                          "<code>matplotlib.pyplot</code> module, but you did "
                                          "not rename it to <code>plt</code> using "
                                          "<code>import matplotlib.pyplot as plt</code>.")

        student_code = dedent('''
            import matplotlib.pyplot as plt
            scatter([1,2,3], [4,5,6])
            plt.title("Some actual stuff")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(prevent_incorrect_plt(), True)
        self.assertEqual(e.final.message, "You have attempted to use the MatPlotLib "
                                          "function named <code>scatter</code>. However, you "
                                          "imported MatPlotLib in a way that does not "
                                          "allow you to use the function directly. I "
                                          "recommend you use <code>plt.scatter</code> instead, "
                                          "after you use <code>import matplotlib.pyplot as "
                                          "plt</code>.")
        student_code = dedent('''
            import matplotlib.pyplot as plt
            plt.scatter([1,2,3], [4,5,6])
            plt.title("Some actual stuff")
            plt.show()
        ''')
        with Execution(student_code) as e:
            self.assertEqual(prevent_incorrect_plt(), False)


class TestSignatures(unittest.TestCase):
    def test_function_signature(self):
        student_code = dedent("""
        def find_string(needle, haystack):
            '''
            Finds the given needle in the haystack.

            Args:
                haystack(list[str]): The list of strings to look within.
                needle(str): The given string to be searching for.
                garbage(list[int, tuple[str, bool], or bool], dict[pair[int, int], str], or bool or int): Woah what the heck.
            Returns:
                bool: Whether the string is in the list.
            '''
        """)
        with Execution(student_code) as e:
            self.assertEqual(function_signature(
                "find_string",
                needle="str", haystack="list[str]",
                garbage="dict[pair[int, int], str], list[int, tuple[str, bool], or bool], or bool or int",
                returns="bool"
            ), ([], True))
        bad_code = dedent("""
            def haha_what(something, another):
                '''
                I don't even know man.

                It's got some stuff in it.

                OH NO I INDENTED.

                arguments:
                    something (int or str): This was a things
                        and now it's also indented.
                    another (banana): A cephalopod
                return:
                    int: Something
                    bool: Or else
                '''
        """)
        with Execution(bad_code) as e:
            self.assertEqual(function_signature(
                "haha_what",
                something="str or int", another="banana",
                returns="bool or int"
            ), ([], True))

        bad_code = dedent("""
            def bad_function(malformed1, malformed2):
                '''
                Some long description

                Args
                malformed1 str Description1
                malformed2 int Description2
                Returns:
                    float: number of pages to fill
                '''
        """)
        with Execution(bad_code) as e:
            signature = function_signature(
                "bad_function",
                malformed1="str", malformed2="int",
                returns="float"
            )
            self.assertEqual(signature[1], True)
            self.assertEqual(set(signature[0]), {"malformed1", "malformed2"})

        student_code = dedent("""
        def fixed_function(malformed1, two_part_name):
            '''
            Some long description

            Args:
                malformed1 (str): The contents of the book as a string
                two_part_name (int): the letters on each page
            Returns:
                float: number of pages to fill
            '''
        """)
        with Execution(student_code) as e:
            signature = function_signature(
                "fixed_function",
                malformed1="str", two_part_name="int",
                returns="float"
            )
            self.assertEqual(signature[1], True)
            self.assertEqual(signature[0], [])




if __name__ == '__main__':
    unittest.main(buffer=False)
