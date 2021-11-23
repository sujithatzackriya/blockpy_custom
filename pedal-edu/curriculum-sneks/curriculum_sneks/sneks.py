from pedal.cait.find_node import find_function_calls
from pedal.assertions import prevent_function_call, prevent_ast
from pedal.core.feedback import CompositeFeedbackFunction, Feedback
from pedal.core.report import MAIN_REPORT
from pedal.core.commands import explain, gently
from pedal.cait import parse_program, find_match, find_matches


def prevent_printing_functions(exceptions=None, report=MAIN_REPORT, **kwargs):
    if exceptions is None:
        exceptions = set()
    elif isinstance(exceptions, str):
        exceptions = {exceptions}
    root = parse_program(report=report)
    defs = root.find_all("FunctionDef")
    for adef in defs:
        name = adef._name
        if name in exceptions:
            continue
        for call in find_function_calls("print", root=adef, report=report):
            location = call.locate()
            return explain(f"The function {name} is printing on line {location.line}."
                           f" However, that function is not supposed to print.",
                           label="function_is_printing", title="Do Not Print in Function",
                           fields={'name': name}, location=location,
                           priority='syntax')
    return False


def ensure_functions_return(exceptions=None, report=MAIN_REPORT, **kwargs):
    if exceptions is None:
        exceptions = set()
    elif isinstance(exceptions, str):
        exceptions = {exceptions}
    root = parse_program(report=report)
    defs = root.find_all("FunctionDef")
    for adef in defs:
        name = adef._name
        if name in exceptions:
            continue
        if not adef.find_match("return"):
            return explain(f"The function {name} is not returning."
                          f" However, that function is supposed to have a return statement.",
                          label="function_does_not_return", title="Must Return in Function",
                          fields={'name': name})
    return False


class only_printing_variables(Feedback):
    """
    Determines whether the user is only printing variables, as opposed to
    literal values.

    """
    title="Print Variables, Not Values"
    category=Feedback.CATEGORIES.INSTRUCTOR
    message_template=("You printed something other than a variable on"
                      " line {location.line:line}. Although that is not a"
                      " normally an issue, we want you to practice printing"
                      " variables in this problem.")

    def __init__(self, root=None, **kwargs):
        fields = kwargs.setdefault('fields', {})
        report = kwargs.setdefault('report', MAIN_REPORT)
        fields['root'] = root or parse_program(report=report)
        super().__init__(**kwargs)

    def condition(self):
        """ Uses find_all to detect matches, ignoring named values. """
        print_calls = find_function_calls('print', root=self.fields['root'],
                                          report=self.report)
        for print_call in print_calls:
            for arg in print_call.args:
                if arg.ast_name != "Name":
                    self.update_location(print_call.lineno)
                    return True
                elif arg.id in ("True", "False", "None"):
                    self.update_location(print_call.lineno)
                    return True
        return False


ADVANCED_ITERATION_FUNCTIONS = [
    "sum", "map", "filter", "reduce",
    "len", "max", "min", "max",
    "sorted", "all", "any",
    "getattr", "setattr",
    "eval", "exec", "iter", "next"
]


@CompositeFeedbackFunction()
def prevent_advanced_iteration(allow_while=False, allow_for=False,
                               allow_function=None, **kwargs):
    """ Prevents the student from using certain advanced iteration functions
    and constructs. Does not currently support blocking recursion. """
    if isinstance(allow_function, str):
        allow_function = {allow_function}
    elif allow_function is None:
        allow_function = set()
    if not allow_while:
        prevent_ast("While")
    if not allow_for:
        prevent_ast("For")
    for function_name in ADVANCED_ITERATION_FUNCTIONS:
        if function_name not in allow_function:
            prevent_function_call(function_name, **kwargs)


@CompositeFeedbackFunction()
def ensure_assignment(variable_name, type=None, value=None, root=None,
                      muted=False, report=MAIN_REPORT):
    """

    Consumes a variable name
    TODO: Implement the value parameter

    :param variable_name: The variable name the student is expected to define.
    :type variable_name: str
    :param type: The string type of the node on the right side of the
                 assignment. Check GreenTreeSnakes (e.g., "Num", or "Str").
    :type type: str
    :return: False or str

    Args:
        root:
        value:
    """
    if root is None:
        root = parse_program()
    # TODO: Tie in Tifa's custom types
    expected_type = get_tifa_type_from_str(type)
    # Find assignments matching the pattern
    pattern = "{variable_name} = __expr__".format(variable_name=variable_name)
    matches = root.find_matches(pattern)
    potentials = []
    for match in matches:
        if type is None:
            return match
        assigned_type = get_tifa_type_from_ast(match["__expr__"].ast_node)
        if are_types_equal(assigned_type, expected_type):
            return match
        potentials.append(match)
    if all(is_literal(potential) for potential in potentials):
        explain(
            (
                "You needed to assign a literal value to {variable}, but you "
                "created an expression instead."
            ).format(variable=variable_name),
            label="did_not_assign_literal",
            title="Expression Instead of Literal",
            report=report, muted=muted
        )
    elif type is None:
        explain(
            (
                "You have not properly assigned anything to the variable " "{variable}."
            ).format(variable=variable_name),
            label="no_assign",
            title="No Proper Assignment",
            report=report, muted=muted
        )
    else:
        explain(
            ("You have not assigned a {type} to the variable {variable}." "").format(
                type=type, variable=variable_name
            ),
            label="wrong_type_assign",
            title="Unexpected Variable Type",
            report=report, muted=muted
        )
    return False
