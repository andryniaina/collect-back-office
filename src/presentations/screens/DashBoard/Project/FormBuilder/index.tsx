import React, { useEffect, useState } from "react";
import FormBuilder from "@/components/FormItem";
import "./index.css";
import {
  findForm,
  postForm,
  updateForm,
} from "../../../../../services/application/form.sa";
import { useParams, useNavigate } from "react-router-dom";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import { getUsersSA } from "@/services/application/user.sa";
import { useQueryClient } from "@tanstack/react-query";
import { ISettings } from "@/data/types/settingsTypes";

const FormBuilderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [options, setOptions] = useState<Option[]>([]);
  useEffect(() => {
    getUsersSA().then((response) => {
      const users = response.data;
      const newOptions = users.map((user: any) => {
        return {
          label: user.email,
          value: user.email,
        };
      });
      setOptions(newOptions);
    });
  }, []);
  const params = useParams();
  const [formName, setFormName] = useState("Form Name");
  const [questions, setQuestions] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleAddQuestion = (index: number) => (question: any) => {
    const newQuestions = [...questions];
    newQuestions[index]["label"] = question.label;
    if (question.type) newQuestions[index]["type"] = question.type;
    newQuestions[index]["settingsData"] = question.settingsData;
    setQuestions(newQuestions);
  };

  const handleAddNewFormBuilder = () => {
    setQuestions([...questions, { label: "", type: "" }]);
  };

  useEffect(() => {
    findForm(params.id ?? "")
      .then((response: any) => {
        setFormName(response.name);
        setQuestions([
          ...questions,
          ...response.fields.map((field: any) => {
            return { label: field.name, type: field.type };
          }),
        ]);
        console.log(response.fields);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const deploy = async () => {
    let payload: any = {};
    payload["fields"] = questions.map(({ label, type,settingsData }: {label:any,type:any,settingsData:ISettings}) => {
      const field:any = { name: label, type} ;
      if(settingsData){
        field.description = settingsData.questionOptions?.guidance;
        field.required = settingsData.questionOptions?.mandatory;
        field.default = settingsData.questionOptions?.default;
        field.validation = {
          message: settingsData.validationCriteria?.errorMessage,
          comparator: settingsData.validationCriteria?.comparator,
          value: settingsData.validationCriteria?.value,
        },
        field.formula = settingsData.validationCriteria?.formula;
      }
      return field;
    });
    payload["status"] = "Deployed";
    console.log({ payload });
    await updateForm(params.id ?? "", payload);
    navigate("/dashboard/project");
  };

  const saveAsDraft = async () => {
    let payload: any = {};
    payload["fields"] = questions.map(({ label, type }: any) => {
      return { name: label, type };
    });
    payload["status"] = "Draft";
    console.log({ payload });
    await updateForm(params.id ?? "", payload);
    queryClient.refetchQueries({ queryKey: ["forms"] });
    navigate("/dashboard/project");
  };

  return (
    <div className="container-builder">
      <div className="form-builder-page">
        <h1>{formName}</h1>
        {questions.map((question, index) => (
          <FormBuilder
            key={index}
            keyValue={index}
            question={question.label}
            questions={questions}
            onAddQuestion={handleAddQuestion(index)}
          />
        ))}
        <button
          className="add-new-form-builder-button"
          onClick={handleAddNewFormBuilder}
        >
          + Add New Question
        </button>
        <MultipleSelector
          key={JSON.stringify(options)}
          defaultOptions={options}
          placeholder="Share this form with"
          emptyIndicator={
            <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
              no user found.
            </p>
          }
        />
        <button className="add-new-form-builder-button" onClick={saveAsDraft}>
          Save as draft
        </button>
        <button className="add-new-form-builder-button" onClick={deploy}>
          Deploy
        </button>
      </div>
    </div>
  );
};

export default FormBuilderPage;
