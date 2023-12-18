import axios from "axios";

export const savePdfOnBackend = async (formData) => {
    try {
        const response = await axios.post('http://localhost:3005/savePdf', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.status === 200) {
            // Backend successfully saved the PDF, retrieve the link
            const { pdfLink } = response.data;
            window.open(pdfLink, '_blank', 'width=600,height=400,resizable=yes,scrollbars=yes');
            return pdfLink;
        } else {
            console.error('Error saving the PDF on the backend:', response.statusText);
            throw new Error('Error saving PDF on the backend');
        }
    } catch (error) {
        console.error('Error saving the PDF on the backend:', error.message);
        throw new Error('Error saving PDF on the backend');
    }
};
