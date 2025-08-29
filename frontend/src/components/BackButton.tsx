import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IoIosArrowBack } from "react-icons/io";


const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center  hover:underline"
    >
      <IoIosArrowBack size={30} />
    </button>
  );
};

export default BackButton;
