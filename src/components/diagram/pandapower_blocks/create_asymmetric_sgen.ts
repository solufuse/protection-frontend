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

export function generateCreateAsymmetricSgenCode(
    asgenId: number, // A unique ID for the generated asymmetric_sgen variable
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
    index?: number,
    scaling: number = 1.0,
    type: 'wye' | 'delta' = 'wye',
    in_service: boolean = true,
): string {
    let code = `asymmetric_sgen_${asgenId} = pandapower.create_asymmetric_sgen(net, bus=${bus}`;

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
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (scaling !== 1.0) {
        code += `, scaling=${formatPythonValue(scaling)}`;
    }
    if (type !== 'wye') {
        code += `, type=${formatPythonValue(type)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }

    code += `)`;
    return code;
}