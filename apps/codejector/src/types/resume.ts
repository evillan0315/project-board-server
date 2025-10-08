export interface PersonalInfoDto {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface ExperienceDto {
  id: number;
  position: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationDto {
  id: number;
  degree: string;
  institution: string;
  year: string;
}

export interface Template {
  id: number;
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
}

export interface ResumeTemplateDto {
  id: number;
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
}

export interface ResumeForm {
  personalInfo: PersonalInfoDto;
  experiences: ExperienceDto[];
  education: EducationDto[];
  skills: string[];
}
