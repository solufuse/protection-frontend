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
    // Handle arrays for geodata specifically (if a motor ever had geodata)
    if (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number')) {
        return `[${value.map(coord => `(${coord[0]}, ${coord[1]})`).join(', ')}]`;
    }
    // For other types, return as string or handle error or throw error
    return String(value);
}

export function generateCreateMotorCode(
    motorId: number, // A unique ID for the generated motor variable
    bus: number,
    pn_mech_mw: number,
    cos_phi: number,
    efficiency_percent: number = 100.0,
    loading_percent: number = 100.0,
    name?: string,
    lrc_pu?: number, // pandapower default is nan
    scaling: number = 1.0,
    vn_kv?: number, // pandapower default is nan
    rx?: number, // pandapower default is nan
    index?: number,
    in_service: boolean = true,
    cos_phi_n?: number, // pandapower default is nan
    efficiency_n_percent?: number, // pandapower default is nan
): string {
    let code = `motor_${motorId} = pandapower.create_motor(net, bus=${formatPythonValue(bus)}, pn_mech_mw=${formatPythonValue(pn_mech_mw)}, cos_phi=${formatPythonValue(cos_phi)}`;

    if (efficiency_percent !== 100.0) {
        code += `, efficiency_percent=${formatPythonValue(efficiency_percent)}`;
    }
    if (loading_percent !== 100.0) {
        code += `, loading_percent=${formatPythonValue(loading_percent)}`;
    }
    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (lrc_pu !== undefined) {
        code += `, lrc_pu=${formatPythonValue(lrc_pu)}`;
    }
    if (scaling !== 1.0) {
        code += `, scaling=${formatPythonValue(scaling)}`;
    }
    if (vn_kv !== undefined) {
        code += `, vn_kv=${formatPythonValue(vn_kv)}`;
    }
    if (rx !== undefined) {
        code += `, rx=${formatPythonValue(rx)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (cos_phi_n !== undefined) {
        code += `, cos_phi_n=${formatPythonValue(cos_phi_n)}`;
    }
    if (efficiency_n_percent !== undefined) {
        code += `, efficiency_n_percent=${formatPythonValue(efficiency_n_percent)}`;
    }

    code += `)`;
    return code;
}