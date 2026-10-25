// src/pages/SignupPage.jsx — create a patient or pharmacy account
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import AuthAside from '../components/AuthAside';
import { Button, IconButton } from '../components/ui/button';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { Field, Input, Select } from '../components/ui/input';
import { SegmentedControl } from '../components/ui/tabs';
import { useLang } from '../context/LanguageContext';
import { pick } from '../lib/format';
import { api, isNetworkError, setSession } from '../lib/api';

const COPY = {
  account: {
    customer: { en: 'Patient account', hi: 'मरीज़ खाता' },
    pharmacist: { en: 'Pharmacy account', hi: 'फार्मेसी खाता' },
  },
  portal: {
    customer: { en: 'Patient', hi: 'मरीज़' },
    pharmacist: { en: 'Pharmacy', hi: 'फार्मेसी' },
  },
  panel: {
    customer: {
      en: 'Keep your searches, saved pharmacies and price alerts in one place.',
      hi: 'अपनी खोजें, सहेजी हुई फार्मेसियाँ और कीमत अलर्ट एक ही जगह रखें।',
    },
    pharmacist: {
      en: 'Publish your stock and bill customers from the pharmacy counter.',
      hi: 'अपना स्टॉक प्रकाशित करें और फार्मेसी काउंटर से ग्राहकों का बिल बनाएँ।',
    },
  },
  bullets: {
    customer: [
      { en: 'Track what you searched', hi: 'अपनी खोजों का रिकॉर्ड रखें' },
      { en: 'Save the pharmacies you use', hi: 'जिन फार्मेसियों से दवा लेते हैं, उन्हें सहेजें' },
      { en: 'Set a price alert for a medicine', hi: 'किसी दवा के लिए कीमत अलर्ट सेट करें' },
    ],
    pharmacist: [
      { en: 'Publish stock and selling prices', hi: 'स्टॉक और बिक्री कीमतें प्रकाशित करें' },
      { en: 'Bill customers at the counter', hi: 'काउंटर पर ग्राहकों का बिल बनाएँ' },
      { en: 'Keep supplier and customer lists', hi: 'आपूर्तिकर्ता और ग्राहकों की सूची रखें' },
    ],
  },
  title: { en: 'Create account', hi: 'खाता बनाएँ' },
  submit: { en: 'Create account', hi: 'खाता बनाएँ' },
  switchPrompt: { en: 'Already have an account?', hi: 'पहले से खाता है?' },
  switchAction: { en: 'Sign in', hi: 'लॉग इन करें' },
  demo: {
    en: 'Demo accounts are stored in this browser.',
    hi: 'डेमो खाते इसी ब्राउज़र में सहेजे जाते हैं।',
  },
  place: { en: 'Dwarka, New Delhi', hi: 'द्वारका, नई दिल्ली' },
  accountType: { en: 'Account type', hi: 'खाते का प्रकार' },
  doneTitle: { en: 'Account created', hi: 'खाता बन गया' },
  doneBody: {
    en: 'Your details are saved in this browser.',
    hi: 'आपका विवरण इसी ब्राउज़र में सहेजा गया है।',
  },
  doneCta: { en: 'Continue', hi: 'आगे बढ़ें' },
};

const LABELS = {
  name: { en: 'Full name', hi: 'पूरा नाम' },
  pharmacyName: { en: 'Pharmacy name', hi: 'फार्मेसी का नाम' },
  email: { en: 'Email address', hi: 'ईमेल पता' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  confirm: { en: 'Confirm password', hi: 'पासवर्ड दोबारा डालें' },
  age: { en: 'Age', hi: 'उम्र' },
  gender: { en: 'Gender', hi: 'लिंग' },
  phone: { en: 'Phone number', hi: 'फ़ोन नंबर' },
  address: { en: 'Pharmacy address', hi: 'फार्मेसी का पता' },
};

const PLACEHOLDERS = {
  name: { en: 'Asha Verma', hi: 'आशा वर्मा' },
  pharmacyName: { en: 'Jan Aushadhi Kendra', hi: 'जन औषधि केंद्र' },
  email: { en: 'you@example.com', hi: 'you@example.com' },
  age: { en: '34', hi: '34' },
  phone: { en: '011-2509 9021', hi: '011-2509 9021' },
  address: { en: 'Sector 3, Dwarka, New Delhi', hi: 'सेक्टर 3, द्वारका, नई दिल्ली' },
};

const SELECT_PLACEHOLDER = { en: 'Select', hi: 'चुनें' };
const SHOW = { en: 'Show password', hi: 'पासवर्ड दिखाएँ' };
const HIDE = { en: 'Hide password', hi: 'पासवर्ड छिपाएँ' };

const GENDERS = [
  { value: 'Male', en: 'Male', hi: 'पुरुष' },
  { value: 'Female', en: 'Female', hi: 'महिला' },
  { value: 'Other', en: 'Other', hi: 'अन्य' },
];

const ERRORS = {
  allFields: { en: 'Please fill all fields.', hi: 'कृपया सभी जानकारी भरें।' },
  required: { en: 'Please fill required fields.', hi: 'कृपया ज़रूरी जानकारी भरें।' },
  mismatch: { en: 'Passwords do not match.', hi: 'दोनों पासवर्ड एक जैसे नहीं हैं।' },
  generic: { en: 'An error occurred.', hi: 'कुछ गलत हो गया।' },
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { lang } = useLang();

  const [userType, setUserType] = useState('customer'); // 'customer' | 'pharmacist'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);

  // Customer form
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', password: '', confirm: '', age: '', gender: '' });
  // Pharmacist form
  const [pharmacistForm, setPharmacistForm] = useState({ name: '', ownerName: '', email: '', password: '', phone: '', address: '', gstin: '', licenseNo: '' });

  const t = (pair) => pick(lang, pair);

  const bindCustomer = (field) => ({
    value: customerForm[field],
    onChange: (event) => setCustomerForm((form) => ({ ...form, [field]: event.target.value })),
  });

  const bindPharmacist = (field) => ({
    value: pharmacistForm[field],
    onChange: (event) => setPharmacistForm((form) => ({ ...form, [field]: event.target.value })),
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (userType === 'customer') {
        if (!customerForm.name || !customerForm.email || !customerForm.password) throw new Error(t(ERRORS.allFields));
        if (customerForm.password !== customerForm.confirm) throw new Error(t(ERRORS.mismatch));
        const { token, user } = await api('/users/register', {
          method: 'POST',
          body: {
            name: customerForm.name.trim(),
            email: customerForm.email.trim(),
            password: customerForm.password,
          },
        });
        setSession('patient', {
          token,
          profile: {
            ...user,
            role: 'customer',
            type: 'customer',
            age: customerForm.age ? Number(customerForm.age) : undefined,
            gender: customerForm.gender || undefined,
          },
        });
      } else {
        if (!pharmacistForm.name || !pharmacistForm.email || !pharmacistForm.password) throw new Error(t(ERRORS.required));
        const { token, pharmacist } = await api('/pharmacist/register', {
          method: 'POST',
          body: {
            name: pharmacistForm.name.trim(),
            ownerName: pharmacistForm.ownerName?.trim() || undefined,
            email: pharmacistForm.email.trim(),
            password: pharmacistForm.password,
            phone: pharmacistForm.phone?.trim() || undefined,
            address: pharmacistForm.address?.trim() || undefined,
            gstin: pharmacistForm.gstin?.trim() || undefined,
            licenseNo: pharmacistForm.licenseNo?.trim() || undefined,
          },
        });
        setSession('pharmacist', { token, profile: pharmacist });
      }
      setStep(2);
    } catch (err) {
      if (isNetworkError(err)) {
        // Offline pilot: continue in demo mode, and say so on the dashboard.
        if (userType === 'customer') {
          setSession('patient', {
            token: '',
            profile: {
              name: customerForm.name,
              email: customerForm.email,
              role: 'customer',
              type: 'customer',
            },
            demo: true,
          });
        } else {
          setSession('pharmacist', {
            token: '',
            profile: {
              name: pharmacistForm.name,
              email: pharmacistForm.email,
              phone: pharmacistForm.phone || '',
              address: pharmacistForm.address || '',
              gstin: pharmacistForm.gstin || '',
              licenseNo: pharmacistForm.licenseNo || '',
            },
            demo: true,
          });
        }
        setStep(2);
        return;
      }
      setError(err.message || t(ERRORS.generic));
    }
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-canvas pt-16">
        <div className="mx-auto grid w-full max-w-page lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2">
          <AuthAside
            accountLabel={t(COPY.account[userType])}
            statement={t(COPY.panel[userType])}
            bullets={COPY.bullets[userType].map((bullet) => t(bullet))}
            place={t(COPY.place)}
          />

          <div className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
            <div className="w-full max-w-[420px]">
              <div className="mb-6 flex justify-center lg:hidden">
                <Logo size={34} textSize="text-xl" />
              </div>

              <CardSpotlight className="rounded-panel">
                <div className="p-6 text-center sm:p-8">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                  <Check className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h1 className="display-3 mt-4 text-ink">{t(COPY.doneTitle)}</h1>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t(COPY.doneBody)}</p>
                <Button
                  onClick={() => navigate(userType === 'pharmacist' ? '/pharmacy-dashboard' : '/')}
                  className="mt-6 w-full"
                >
                  {t(COPY.doneCta)}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </Button>
                </div>
              </CardSpotlight>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
                {t(COPY.demo)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas pt-16">
      <div className="mx-auto grid w-full max-w-page lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2">
        <AuthAside
          accountLabel={t(COPY.account[userType])}
          statement={t(COPY.panel[userType])}
          bullets={COPY.bullets[userType].map((bullet) => t(bullet))}
          place={t(COPY.place)}
        />

        <div className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex justify-center lg:hidden">
              <Logo size={34} textSize="text-xl" />
            </div>

            <CardSpotlight className="rounded-panel">
              <div className="p-6 sm:p-8">
              <SegmentedControl
                label={t(COPY.accountType)}
                options={[
                  { id: 'customer', label: t(COPY.portal.customer) },
                  { id: 'pharmacist', label: t(COPY.portal.pharmacist) },
                ]}
                value={userType}
                onChange={(next) => { setUserType(next); setError(''); }}
                className="w-full [&>button]:h-10 [&>button]:flex-1 [&>button]:text-xs"
              />

              <div className="mt-6">
                <h1 className="display-3 text-ink">{t(COPY.title)}</h1>
                <p className="mt-1.5 text-xs leading-relaxed text-muted lg:hidden">
                  {t(COPY.panel[userType])}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-field border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs font-medium text-danger"
                >
                  <AlertCircle className="mt-px h-4 w-4 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="min-w-0">{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="mt-5 space-y-4">
                {userType === 'customer' ? (
                  <>
                    <Field label={t(LABELS.name)} htmlFor="signup-name" required>
                      <Input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder={t(PLACEHOLDERS.name)}
                        className="min-h-[44px]"
                        {...bindCustomer('name')}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t(LABELS.age)} htmlFor="signup-age" className="min-w-0">
                        <Input
                          id="signup-age"
                          type="number"
                          min="1"
                          max="120"
                          placeholder={t(PLACEHOLDERS.age)}
                          className="min-h-[44px]"
                          {...bindCustomer('age')}
                        />
                      </Field>

                      <Field label={t(LABELS.gender)} htmlFor="signup-gender" className="min-w-0">
                        <Select
                          id="signup-gender"
                          className="min-h-[44px]"
                          {...bindCustomer('gender')}
                        >
                          <option value="">{t(SELECT_PLACEHOLDER)}</option>
                          {GENDERS.map((gender) => (
                            <option key={gender.value} value={gender.value}>
                              {t(gender)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </>
                ) : (
                  <Field label={t(LABELS.pharmacyName)} htmlFor="signup-pharmacy-name" required>
                    <Input
                      id="signup-pharmacy-name"
                      type="text"
                      autoComplete="organization"
                      required
                      placeholder={t(PLACEHOLDERS.pharmacyName)}
                      className="min-h-[44px]"
                      {...bindPharmacist('name')}
                    />
                  </Field>
                )}

                <Field label={t(LABELS.email)} htmlFor="signup-email" required>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t(PLACEHOLDERS.email)}
                    className="min-h-[44px]"
                    {...(userType === 'customer' ? bindCustomer('email') : bindPharmacist('email'))}
                  />
                </Field>

                {userType === 'pharmacist' && (
                  <>
                    <Field label={t(LABELS.phone)} htmlFor="signup-phone" required>
                      <Input
                        id="signup-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder={t(PLACEHOLDERS.phone)}
                        className="min-h-[44px]"
                        {...bindPharmacist('phone')}
                      />
                    </Field>

                    <Field label={t(LABELS.address)} htmlFor="signup-address" required>
                      <Input
                        id="signup-address"
                        type="text"
                        autoComplete="street-address"
                        required
                        placeholder={t(PLACEHOLDERS.address)}
                        className="min-h-[44px]"
                        {...bindPharmacist('address')}
                      />
                    </Field>
                  </>
                )}

                <Field label={t(LABELS.password)} htmlFor="signup-password" required>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="min-h-[44px] pr-12"
                      {...(userType === 'customer' ? bindCustomer('password') : bindPharmacist('password'))}
                    />
                    <div className="absolute inset-y-0 right-1 flex items-center">
                      <IconButton
                        size="md"
                        onClick={() => setShowPass((value) => !value)}
                        aria-label={showPass ? t(HIDE) : t(SHOW)}
                        aria-pressed={showPass}
                        className="text-muted hover:text-ink"
                      >
                        {showPass ? (
                          <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        )}
                      </IconButton>
                    </div>
                  </div>
                </Field>

                {userType === 'customer' && (
                  <Field label={t(LABELS.confirm)} htmlFor="signup-confirm" required>
                    <Input
                      id="signup-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="min-h-[44px]"
                      {...bindCustomer('confirm')}
                    />
                  </Field>
                )}

                <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
                  {t(COPY.submit)}
                </Button>
              </form>

              <div className="mt-6 border-t border-line pt-4">
                <p className="text-center text-xs text-muted">
                  {t(COPY.switchPrompt)}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-ink"
                  >
                    {t(COPY.switchAction)}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </p>
              </div>
              </div>
            </CardSpotlight>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
              {t(COPY.demo)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
