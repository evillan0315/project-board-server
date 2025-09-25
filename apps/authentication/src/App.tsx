import {type JSX} from 'react';
import data from './data/data.json';
import { CodeGenerator, type CodeGeneratorData } from '@/components/Generator/Code/CodeGenerator';

export default function App(): JSX.Element {
  return <CodeGenerator data={data as CodeGeneratorData} />;
}

