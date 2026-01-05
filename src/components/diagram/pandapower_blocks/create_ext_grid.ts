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

export function generateCreateExtGridCode(
    extGridId: number, // A unique ID for the generated ext_grid variable
    bus: number,
    vm_pu: number = 1.0,
    va_degree: number = 0.0,
    name?: string,
    in_service: boolean = true,
    s_sc_max_mva?: number, // pandapower default is nan
    s_sc_min_mva?: number, // pandapower default is nan
    rx_max?: number, // pandapower default is nan
    rx_min?: number, // pandapower default is nan
    max_p_mw?: number, // pandapower default is nan
    min_p_mw?: number, // pandapower default is nan
    max_q_mvar?: number, // pandapower default is nan
    min_q_mvar?: number, // pandapower default is nan
    index?: number,
    r0x0_max?: number, // pandapower default is nan
    x0x_max?: number, // pandapower default is nan
    controllable?: boolean, // pandapower default is nan
    slack_weight: number = 1.0,
): string {
    let code = `ext_grid_${extGridId} = pandapower.create_ext_grid(net, bus=${bus}`;

    if (vm_pu !== 1.0) {
        code += `, vm_pu=${formatPythonValue(vm_pu)}`;
    }
    if (va_degree !== 0.0) {
        code += `, va_degree=${formatPythonValue(va_degree)}`;
    }
    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (s_sc_max_mva !== undefined) {
        code += `, s_sc_max_mva=${formatPythonValue(s_sc_max_mva)}`;
    }
    if (s_sc_min_mva !== undefined) {
        code += `, s_sc_min_mva=${formatPythonValue(s_sc_min_mva)}`;
    }
    if (rx_max !== undefined) {
        code += `, rx_max=${formatPythonValue(rx_max)}`;
    }
    if (rx_min !== undefined) {
        code += `, rx_min=${formatPythonValue(rx_min)}`;
    }
    if (max_p_mw !== undefined) {
        code += `, max_p_mw=${formatPythonValue(max_p_mw)}`;
    }
    if (min_p_mw !== undefined) {
        code += `, min_p_mw=${formatPythonValue(min_p_mw)}`;
    }
    if (max_q_mvar !== undefined) {
        code += `, max_q_mvar=${formatPythonValue(max_q_mvar)}`;
    }
    if (min_q_mvar !== undefined) {
        code += `, min_q_mvar=${formatPythonValue(min_q_mvar)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (r0x0_max !== undefined) {
        code += `, r0x0_max=${formatPythonValue(r0x0_max)}`;
    }
    if (x0x_max !== undefined) {
        code += `, x0x_max=${formatPythonValue(x0x_max)}`;
    }
    if (controllable !== undefined) {
        code += `, controllable=${formatPythonValue(controllable)}`;
    }
    if (slack_weight !== 1.0) {
        code += `, slack_weight=${formatPythonValue(slack_weight)}`;
    }

    code += `)`;
    return code;
}