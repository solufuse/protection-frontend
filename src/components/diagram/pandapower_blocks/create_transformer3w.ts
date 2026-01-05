import { isNaN } from 'lodash';

function formatPythonValue(value: any): string {
    if (typeof value === 'string') {
        return `'${value}'`;
    }
    if (typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return "float('nan')"; // Use float('nan') for NaN in Python
        }
        return String(value);
    }
    return String(value);
}

export function generateCreateTransformer3wCode(
    trafo3wId: number, // A unique ID for the generated transformer3w variable
    hv_bus: number,
    mv_bus: number,
    lv_bus: number,
    std_type: string,
    name?: string,
    tap_pos?: number, // pandapower default is nan (neutral position)
    in_service: boolean = true,
    index?: number,
    max_loading_percent?: number, // pandapower default is nan
    tap_changer_type?: 'Ratio' | 'Symmetrical' | 'Ideal' | 'Tabular',
    tap_at_star_point: boolean = false,
    tap_dependency_table: boolean = false,
    id_characteristic_table?: number, // pandapower default is None
): string {
    let code = `trafo3w_${trafo3wId} = pandapower.create_transformer3w(net, hv_bus=${hv_bus}, mv_bus=${mv_bus}, lv_bus=${lv_bus}, std_type=${formatPythonValue(std_type)}`;

    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (tap_pos !== undefined) {
        code += `, tap_pos=${formatPythonValue(tap_pos)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (max_loading_percent !== undefined) {
        code += `, max_loading_percent=${formatPythonValue(max_loading_percent)}`;
    }
    if (tap_changer_type !== undefined) {
        code += `, tap_changer_type=${formatPythonValue(tap_changer_type)}`;
    }
    if (tap_at_star_point === true) {
        code += `, tap_at_star_point=${formatPythonValue(tap_at_star_point)}`;
    }
    if (tap_dependency_table === true) {
        code += `, tap_dependency_table=${formatPythonValue(tap_dependency_table)}`;
    }
    if (id_characteristic_table !== undefined) {
        code += `, id_characteristic_table=${formatPythonValue(id_characteristic_table)}`;
    }

    code += `)`;
    return code;
}