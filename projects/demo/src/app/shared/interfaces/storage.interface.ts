export interface IFile {
  downloadUrl: string;
  fileSize: number;
  fileType: string;
  filename: string;
  key: string;
  name: string;
  type: string;
  downloadURL?: string;
  ratio?: string;
}

export interface ITempFile {
  name: string;
  size: number;
  type: string;
  file: IFile;
  rawFile: File;
}
