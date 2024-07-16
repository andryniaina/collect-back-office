import axios from "./axiosInstance";

export const postForm = async (formData: any) => {
  try {
    const response = await axios.post(`forms`, formData);
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};
