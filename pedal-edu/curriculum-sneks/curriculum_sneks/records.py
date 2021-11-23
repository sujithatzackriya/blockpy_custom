from pedal.core.commands import explain
from pedal.core.report import MAIN_REPORT
from pedal.types.definitions import Type, DictType, LiteralStr, ListType
from pedal.types.normalize import get_pedal_type_from_str


def make_record(a_record) -> Type:
    if isinstance(a_record, dict):
        return DictType(literals=[LiteralStr(s) for s in a_record.keys()],
                        values=[make_record(value)
                                for value in a_record.values()])
    elif isinstance(a_record, list):
        return ListType(subtype=make_record(a_record[0]))
    else:
        return get_pedal_type_from_str(str(a_record))


def check_record_instance(record_instance, record_type, instance_identifier, type_identifier,
                          report=MAIN_REPORT):
    """

    Args:
        record_instance:
        record_type:
        instance_identifier:
        type_identifier:

    Returns:

    """
    fields = {
        'record_instance': record_instance,
        'record_type': record_type,
        'instance_identifier': instance_identifier,
        'type_identifier': type_identifier
    }
    if not isinstance(record_instance, dict):
        return explain(f"{instance_identifier} was not a {type_identifier}"
                f" because it is not a dictionary.",
                label="record_not_a_dictionary", title="Not a Dictionary",
                fields=fields)
    for expected_key, expected_value_type in record_type.items():
        if expected_key not in record_instance:
            fields['expected_key'] = expected_key
            return explain(f"{instance_identifier} was supposed to have"
                           f" the key `{expected_key}`, but it did not.",
                           label="record_missing_key", title="Record Missing Key",
                           fields=fields)
        actual_value = record_instance[expected_key]
        # TODO: Handle nested record types
        if isinstance(expected_value_type, list):
            if not isinstance(actual_value, list):
                fields['expected_key'] = expected_key
                return explain(f"{instance_identifier} was not a {type_identifier}"
                               f" because its key `{expected_key}` did not have a list.",
                               label="record_missing_list", title="Record Missing List")
            elif actual_value:
                actual_value = actual_value[0]
                expected_value_type = expected_value_type[0]
        if not isinstance(actual_value, expected_value_type):
            fields['expected_key'] = expected_key
            fields['actual_value'] = actual_value
            fields['expected_value_type'] = expected_value_type
            fields['expected_value_type_name'] = expected_value_type.__name__
            return explain(f"{instance_identifier} was not a {type_identifier}"
                           f" because its key `{expected_key}` did not have"
                           f" a `{expected_value_type.__name__}` value",
                           label="record_wrong_key_type", title="Record Value Is Wrong Type",
                           fields=fields)
    if len(record_type) != len(record_instance):
        return explain(f"{instance_identifier} had extra keys that it should not have.",
                label="record_has_extra_keys", title="Unnecessary Keys",
                fields=fields)
    return False
