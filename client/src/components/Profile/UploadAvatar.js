import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Form,
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import { uploadFile, updateUser } from "../../lib/strapiClient";

const UpoloadAvatar = ({
  userId,
  token,
  username,
  avatarUrl,
  setisUserUpdated,
}) => {
  const [modal, setModal] = useState(false);
  const [file, setFile] = useState(null);

  const toggle = () => {
    setModal(!modal);
  };

  const handleFileChange = ({ target: { files } }) => {
    if (files?.length) {
      const { type } = files[0];
      if (type === "image/png" || type === "image/jpeg") {
        setFile(files[0]);
      } else {
        toast.error("Accept only png and jpeg image types are allowed*", {
          hideProgressBar: true,
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("File is required*", {
        hideProgressBar: true,
      });
      return;
    }

    try {
      const uploadedFiles = await uploadFile(file, `${username} avatar`);
      
      // Handle Strapi v5 response format (array of files or single file object)
      const fileData = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;
      const id = fileData.id || fileData.data?.id || fileData.documentId;
      const url = fileData.url || fileData.data?.attributes?.url || fileData.data?.url;
      
      if (!id || !url) {
        throw new Error('Invalid file upload response');
      }
      
      // Strapi v5: Avatar sebagai relation dengan ID saja (number)
      // Format: { avatar: id } atau { avatarId: id }
      // userId tidak diperlukan karena menggunakan /users/me endpoint
      await updateUser(userId, { avatarId: id }); // avatarId akan di-convert ke avatar relation
      
      // Set flag untuk trigger refresh profile
      setisUserUpdated(true);
      
      toast.success("Avatar uploaded successfully!", {
        hideProgressBar: true,
      });
      
      setFile(null);
      setModal(false);
      
      // Force refresh profile after a short delay
      setTimeout(() => {
        setisUserUpdated(true);
      }, 500);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           "Failed to upload avatar";
      
      toast.error(errorMessage, {
        hideProgressBar: true,
      });
    }
  };

  return (
    <div>
      <Button size="sm" onClick={toggle}>
        {`${avatarUrl ? "Change" : "Upload"} picture`}
      </Button>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>{`${
          avatarUrl ? "Change" : "Upload"
        } your avatar`}</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="exampleFile">File</Label>
              <Input
                type="file"
                name="file"
                id="exampleFile"
                onChange={handleFileChange}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSubmit}>
            Upload
          </Button>
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default UpoloadAvatar;
