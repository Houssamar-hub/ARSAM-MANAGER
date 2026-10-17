import mongoose from "mongoose";

export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

 
    next();
  };
};