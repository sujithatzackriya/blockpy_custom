class TestRecords(unittest.TestCase):
    def test_check_instance_works(self):
        student_code = dedent("""
        banana = {"Name": "Banana", "Age": 47, "Macros": [0, 24, 33]}
        """)
        Fruit = {"Name": str, "Age": int, "Macros": [int]}
        with Execution(student_code) as e:
            result = check_record_instance(e.student.data['banana'], Fruit, "banana", "Fruit")
        self.assertTrue(result)

    def test_check_instance_failed_dict(self):
        student_code = dedent("""
        banana = "Banana"
        """)
        Fruit = {"Name": str, "Age": int, "Macros": [int]}
        with Execution(student_code) as e:
            result = check_record_instance(e.student.data['banana'], Fruit, "`banana`", "Fruit")
        self.assertFalse(result)
        self.assertEqual("`banana` was not a Fruit because it is not a dictionary.", e.final.message)

    def test_check_instance_failed_missing_key(self):
        student_code = dedent("""
        banana = {"Name": "Banana", "Macros": [0, 24, 33]}
        """)
        Fruit = {"Name": str, "Age": int, "Macros": [int]}
        with Execution(student_code) as e:
            result = check_record_instance(e.student.data['banana'], Fruit, "`banana`", "Fruit")
        self.assertFalse(result)
        self.assertEqual("`banana` was supposed to have the key `Age`, but it did not.", e.final.message)

    def test_check_instance_failed_wrong_key_type(self):
        student_code = dedent("""
        banana = {"Name": "Banana", "Age": 'old', "Macros": [0, 24, 33]}
        """)
        Fruit = {"Name": str, "Age": int, "Macros": [int]}
        with Execution(student_code) as e:
            result = check_record_instance(e.student.data['banana'], Fruit, "`banana`", "Fruit")
        self.assertFalse(result)
        self.assertEqual("`banana` was not a Fruit because its key `Age` did not have a `int` value", e.final.message)

    def test_check_instance_failed_extra_keys(self):
        student_code = dedent("""
        banana = {"Name": "Banana", "Age": 4, "Dumb": "Wrong", "Macros": [0, 24, 33]}
        """)
        Fruit = {"Name": str, "Age": int, "Macros": [int]}
        with Execution(student_code) as e:
            result = check_record_instance(e.student.data['banana'], Fruit, "`banana`", "Fruit")
        self.assertFalse(result)
        self.assertEqual("`banana` had extra keys that it should not have.", e.final.message)
