class TestFunctions(unittest.TestCase):

    def test_match_signature(self):
        with Execution('a = 0\na') as e:
            self.assertIsNone(match_signature('a', 0))
        self.assertEqual(e.final.message, "No function named <code>a</code> "
                                          "was found.")

        with Execution('def a():\n  pass\na') as e:
            self.assertIsNotNone(match_signature('a', 0))
        self.assertNotEqual(e.final.message, "No function named <code>a</code> "
                                             "was found.")

        with Execution('def a():\n  pass\na') as e:
            self.assertIsNone(match_signature('a', 1))
        self.assertNotEqual(e.final.message, "The function named <code>a</code> "
                                             "has fewer parameters (0) than expected (1)")

        with Execution('def a(x, y):\n  pass\na') as e:
            self.assertIsNone(match_signature('a', 1))
        self.assertNotEqual(e.final.message, "The function named <code>a</code> "
                                             "has fewer parameters (2) than expected (1)")

        with Execution('def a(l, m):\n  pass\na') as e:
            self.assertIsNone(match_signature('a', 2, 'x', 'y'))
        self.assertEqual(e.final.message, "Error in definition of "
                                          "<code>a</code>. Expected a parameter named "
                                          "x, instead found l.")

        with Execution('def a(x, y):\n  pass\na') as e:
            self.assertIsNotNone(match_signature('a', 2, 'x', 'y'))
        self.assertNotEqual(e.final.message, "Error in definition of "
                                             "<code>a</code>. Expected a parameter named "
                                             "x, instead found l.")

    def test_match_parameters(self):
        with Execution('def a(x:str, y:int):\n  pass\na') as e:
            self.assertIsNone(match_parameters('a', int, "int"))
        self.assertEqual(e.final.message,
                         "Error in definition of function `a` parameter `x`. "
                         "Expected `int`, instead found `str`.")

        with Execution('def a(x:int, y:int):\n  pass\na') as e:
            self.assertIsNotNone(match_parameters('a', int, "int"))
        self.assertNotEqual(e.final.message, "Error in definition of "
                                             "function `a`. Expected `int` parameter, instead found `str`.")

        with Execution('def a(x:[str], y:{int:str}):\n  pass\na') as e:
            self.assertIsNotNone(match_parameters('a', "[str]", "{int:str}"))
        self.assertNotEqual(e.final.message,
                            "Error in definition of function `a` parameter `x`. "
                            "Expected `int`, instead found `str`.")

        with Execution('def a(x:[str], y:{int:str}):\n  pass\na') as e:
            self.assertIsNotNone(match_parameters('a', "[str]", {int: str}))
        self.assertNotEqual(e.final.message,
                            "Error in definition of function `a` parameter `x`. "
                            "Expected `int`, instead found `str`.")

        with Execution('def a(x:{str:[bool]}):\n  pass\na') as e:
            self.assertIsNone(match_parameters('a', "{int: [bool]}"))
        self.assertEqual(e.final.message,
                         "Error in definition of function `a` parameter `x`. "
                         "Expected `{int: [bool]}`, instead found `{str: [bool]}`.")

        with Execution('def a(x:int)->int:\n  pass\na') as e:
            self.assertIsNotNone(match_parameters('a', int, returns=int))
        self.assertNotEqual(e.final.message, "Not right")

        with Execution('def a(x:int)->int:\n  pass\na') as e:
            self.assertIsNone(match_parameters('a', int, returns=str))
        self.assertEqual(e.final.message, "Error in definition of function `a` return type. Expected `str`, instead "
                                          "found int.")

    def test_unit_test(self):
        # All passing
        with Execution('def a(x,y):\n  return(x+y)\na') as e:
            self.assertIsNotNone(unit_test('a', (1, 2, 3)))
        self.assertEqual(e.final.message, "No errors reported.")

        # All failing
        with Execution('def a(x,y):\n  return(x-y)\na') as e:
            self.assertIsNone(unit_test('a', (1, 2, 3)))
        self.assertIn("it failed 1/1 tests", e.final.message)

        # Some passing, some failing
        with Execution('def a(x,y):\n  return(x-y)\na') as e:
            self.assertIsNone(unit_test('a', (1, 2, 3), (0, 0, 0)))
        self.assertIn("it failed 1/2 tests", e.final.message)

        # Optional tip
        with Execution('def a(x,y):\n  return(x-y)\na') as e:
            self.assertIsNone(unit_test('a', (1, 2, (3, "Try again!"))))
        self.assertIn("it failed 1/1 tests", e.final.message)
        self.assertIn("Try again!", e.final.message)

        # Float precision
        with Execution('def a(x,y):\n  return(x+y)\na') as e:
            self.assertIsNotNone(unit_test('a', (1.0, 2.0, 3.0)))
        self.assertEqual(e.final.message, "No errors reported.")

        # Not a function
        with Execution('a = 5\na') as e:
            self.assertIsNone(unit_test('a', (1, 2, 3)))
        self.assertEqual(e.final.message, "You defined a, but did not define "
                                          "it as a function.")

        # Not defined
        with Execution('x = 5\nx') as e:
            self.assertIsNone(unit_test('a', (1, 2, 3)))
        self.assertEqual(e.final.message, "The function <code>a</code> was "
                                          "not defined.")

    def test_output_test(self):
        # All passing
        with Execution('def a(x):\n  print(x+1)\na(1)') as e:
            self.assertIsNotNone(output_test('a', (2, "3")))
        self.assertEqual(e.final.message, "No errors reported.")

        # All failing
        with Execution('def a(x,y):\n  print(x-y)\na(1,2)') as e:
            self.assertIsNone(output_test('a', (1, 2, "3")))
        self.assertIn("wrong output 1/1 times", e.final.message)

        # All passing, multiline
        with Execution('def a(x):\n  print(x+1)\n  print(x+2)\na(1)') as e:
            self.assertIsNotNone(output_test('a', (4, ["5", "6"])))
        self.assertEqual(e.final.message, "No errors reported.")

    def test_check_coverage(self):
        test_files = [
            (here + 'sandbox_coverage/bad_non_recursive.py', {4}),
            (here + 'sandbox_coverage/good_recursive.py', False),
            (here + 'sandbox_coverage/complex.py', {7, 9, 10, 11, 12, 13, 14, 15}),
        ]
        for TEST_FILENAME, missing_lines in test_files:
            with open(TEST_FILENAME) as student_file:
                student_code = student_file.read()
            set_source(student_code, report=MAIN_REPORT)
            student = Sandbox()
            student.tracer_style = 'coverage'
            student.run(student_code, filename=TEST_FILENAME)
            uncovered, percentage = check_coverage()
            self.assertEqual(uncovered, missing_lines)
