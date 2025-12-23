const { createApp, ref } = Vue;

const DEFAULT_CONFIG = {
    "projectName": "HV_Renovation_2025",
    "inrushTransformers": [
        { "NOM": "TX1-A", "Sn_kVA": 85000, "U_kV": 220, "Ratio_Iencl": 7.0, "Tau_ms": 3000 },
        { "NOM": "TX2-A", "Sn_kVA": 250, "U_kV": 20, "Ratio_Iencl": 12.0, "Tau_ms": 250 }
    ],
    "plans": [
        { "ID": "CB_TX1-A", "TITRE": "HV Transformer", "TYPE": "TRANSFORMER", "SENSOR": "CT 400/1 A", "TX_SOURCE": "TX1-A", "ACTIVE_FUNCTIONS": ["50/51"] },
        { "ID": "CB_HV0-A", "TITRE": "HV Incomer", "TYPE": "INCOMER", "BUS_FROM": "Bus HV0-A", "BUS_TO": "Bus HV1-A", "SENSOR": "CT 400/1 A", "ACTIVE_FUNCTIONS": ["50/51", "67"] }
    ]
};

createApp({
    setup() {
        const isDragging = ref(false);
        const files = ref([]);
        const configJson = ref(JSON.stringify(DEFAULT_CONFIG, null, 2));
        const loading = ref(false);
        const result = ref(null);
        const activeRelay = ref(null);
        const fileInput = ref(null);

        const handleFiles = (e) => {
            if(e.target.files) files.value = [...e.target.files];
        };

        const handleDrop = (e) => {
            isDragging.value = false;
            if(e.dataTransfer.files) files.value = [...e.dataTransfer.files];
        };

        const resetConfig = () => {
            configJson.value = JSON.stringify(DEFAULT_CONFIG, null, 2);
        };

        const runCalculation = async () => {
            loading.value = true;
            result.value = null;
            activeRelay.value = null;
            
            const formData = new FormData();
            files.value.forEach(f => formData.append('files', f));
            formData.append('config', configJson.value);

            try {
                const response = await fetch('https://api.solufuse.com/protection/run-study', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Erreur API: ${errText}`);
                }

                const data = await response.json();
                result.value = data;

                // Auto-select premier onglet
                const keys = Object.keys(data.results || {});
                if (keys.length > 0) activeRelay.value = keys[0];

            } catch (error) {
                alert("Erreur: " + error.message);
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const downloadExcel = () => {
            if (!result.value || !result.value.file_base64) return;
            const link = document.createElement("a");
            link.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + result.value.file_base64;
            link.download = result.value.download_name || "Resultat.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return {
            isDragging, files, configJson, loading, result, fileInput, activeRelay,
            handleFiles, handleDrop, resetConfig, runCalculation, downloadExcel
        };
    }
}).mount('#app');