import { isNaN } from 'lodash';

function formatPythonValue(value: any): string {
    if (value === null) { // Handle null explicitly for Python None
        return "None";
    }
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

export function generateCreateAsymmetricLoadCode(
    loadId: number, // A unique ID for the generated load variable
    bus: number,
    p_a_mw: number = 0,
    p_b_mw: number = 0,
    p_c_mw: number = 0,
    q_a_mvar: number = 0,
    q_b_mvar: number = 0,
    q_c_mvar: number = 0,
    sn_a_mva?: number, // pandapower default is nan
    sn_b_mva?: number, // pandapower default is nan
    sn_c_mva?: number, // pandapower default is nan
    sn_mva?: number, // pandapower default is nan
    name?: string,
    scaling: number = 1.0,
    index?: number,
    in_service: boolean = true,
    type: 'wye' | 'delta' = 'wye',
): string {
    let code = `asymmetric_load_${loadId} = pandapower.create_asymmetric_load(net, bus=${formatPythonValue(bus)}`;

    if (p_a_mw !== 0) {
        code += `, p_a_mw=${formatPythonValue(p_a_mw)}`;
    }
    if (p_b_mw !== 0) {
        code += `, p_b_mw=${formatPythonValue(p_b_mw)}`;
    }
    if (p_c_mw !== 0) {
        code += `, p_c_mw=${formatPythonValue(p_c_mw)}`;
    }
    if (q_a_mvar !== 0) {
        code += `, q_a_mvar=${formatPythonValue(q_a_mvar)}`;
    }
    if (q_b_mvar !== 0) {
        code += `, q_b_mvar=${formatPythonValue(q_b_mvar)}`;
    }
    if (q_c_mvar !== 0) {
        code += `, q_c_mvar=${formatPythonValue(q_c_mvar)}`;
    }
    if (sn_a_mva !== undefined) {
        code += `, sn_a_mva=${formatPythonValue(sn_a_mva)}`;
    }
    if (sn_b_mva !== undefined) {
        code += `, sn_b_mva=${formatPythonValue(sn_b_mva)}`;
    }
    if (sn_c_mva !== undefined) {
        code += `, sn_c_mva=${formatPythonValue(sn_c_mva)}`;
    }
    if (sn_mva !== undefined) {
        code += `, sn_mva=${formatPythonValue(sn_mva)}`;
    }
    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (scaling !== 1.0) {
        code += `, scaling=${formatPythonValue(scaling)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (type !== 'wye') {
        code += `, type=${formatPythonValue(type)}`;
    }

    code += `)`;
    return code;
}