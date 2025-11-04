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
      const [{ id, url }] = uploadedFiles;
      
      await updateUser(userId, { avatarId: id, avatarUrl: url });
      
      setisUserUpdated(true);
      setFile(null);
      setModal(false);
    } catch (error) {
      console.log({ error });
      toast.error("Failed to upload avatar", {
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
