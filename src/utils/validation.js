export const validateSignupForm = (data) => {
    let errors = {};

    if (!data.firstName?.trim()) {
        errors.firstName = 'First name is required';
    }
    if (!data.lastName?.trim()) {
        errors.lastName = 'Last name is required';
    }
    if (!data.middleName?.trim()) {
        errors.middleName = 'Middle name is required';
    }
    if (!data.programmingLevel) {
        errors.programmingLevel = 'Programming level is required';
    }
    if (!data.country) {
        errors.country = "Country is required";
    }

    if (!data.occupation) {
        errors.occupation = "Occupation is required";
    }

    if (!data.email) {
        errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        errors.email = 'Email address is invalid';
    }
    if (!data.password) {
        errors.password = 'Password is required';
    } else {
        if (data.password.length < 6 || !/[a-z]/.test(data.password) || !/[A-Z]/.test(data.password) || !/[^a-zA-Z0-9]/.test(data.password)) {
            errors.password = 'Password must be at least 6 characters , at least one lowercase letter (a-z). , one uppercase letter (A-Z).  at least one non-alphanumeric character.';
        }
    }

    return errors;
};

export const validateLoginForm = (data) => {
    let errors = {};

    if (!data.email) {
        errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        errors.email = 'Email address is invalid';
    }
    if (!data.password) {
        errors.password = 'Password is required';
    }
    return errors;
};