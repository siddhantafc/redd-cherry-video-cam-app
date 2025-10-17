
import React, { useState } from 'react';
import HostSignUpForm from '../../../../components/signup/HostSignUpForm';

const HostSignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [agencyCode, setAgencyCode] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  return (
    <HostSignUpForm
      navigation={navigation}
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      phone={phone}
      setPhone={setPhone}
      agencyCode={agencyCode}
      setAgencyCode={setAgencyCode}
      dob={dob}
      setDob={setDob}
      gender={gender}
      setGender={setGender}
      isPremium={isPremium}
      setIsPremium={setIsPremium}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      passwordsMatch={passwordsMatch}
    />
  );
};

export default HostSignupScreen;
