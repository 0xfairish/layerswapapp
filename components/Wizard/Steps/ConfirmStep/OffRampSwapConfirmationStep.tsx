import { useRouter } from 'next/router';
import { FC, useCallback, useState } from 'react'
import { useFormWizardaUpdate } from '../../../../context/formWizardProvider';
import { useSwapDataState, useSwapDataUpdate } from '../../../../context/swap';
import { SwapCreateStep } from '../../../../Models/Wizard';
import SubmitButton from '../../../buttons/submitButton';
import toast from 'react-hot-toast';
import AddressDetails from '../../../DisclosureComponents/AddressDetails';
import NetworkSettings from '../../../../lib/NetworkSettings';
import WarningMessage from '../../../WarningMessage';
import SwapConfirmMainData from '../../../Common/SwapConfirmMainData';
import { ApiError, KnownwErrorCode } from '../../../../Models/ApiError';
import KnownInternalNames from '../../../../lib/knownIds';

const OffRampSwapConfirmationStep: FC = () => {
    const { swapFormData, swap } = useSwapDataState()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { createAndProcessSwap, processPayment } = useSwapDataUpdate()
    const { goToStep } = useFormWizardaUpdate<SwapCreateStep>()
    const { network } = swapFormData || {}
    const router = useRouter();

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true)
        let nextStep: SwapCreateStep;
        try {
            if (!swap) {
                const swapId = await createAndProcessSwap();
                await router.push(`/${swapId}`)
            }
            else {
                const swapId = swap.id
                await processPayment(swapId)
                await router.push(`/${swapId}`)
            }
        }
        catch (error) {
            const data: ApiError = error?.response?.data?.error
            if (!data) {
                toast.error(error.message)
                return
            }
            if (data.code === KnownwErrorCode.INVALID_CREDENTIALS) {
                nextStep = SwapCreateStep.OffRampOAuth
            }
            else
                toast.error(data?.message)
        }
        setIsSubmitting(false)
        if (nextStep)
            goToStep(nextStep)
    }, [network, swap, createAndProcessSwap])

    return (
        <>
            <div className='h-full flex flex-col justify-between'>
                <SwapConfirmMainData>
                    {
                        NetworkSettings.KnownSettings[network?.baseObject?.internal_name]?.ConfirmationWarningMessage &&
                        <WarningMessage className='mb-4'>
                            <p className='font-normal space-x-1 text-sm text-darkblue-600'>
                                <span>{NetworkSettings.KnownSettings[network?.baseObject?.internal_name]?.ConfirmationWarningMessage}.</span>
                                {
                                    network?.baseObject?.internal_name == KnownInternalNames.Networks.LoopringMainnet &&
                                    <a className='underline hover:no-underline' target="_blank" href='https://docs.layerswap.io/user-docs/using-gamestop-wallet-to-transfer-to-cex'>Learn how</a>
                                }
                            </p>
                        </WarningMessage>
                    }
                    <AddressDetails canEditAddress={false} />
                </SwapConfirmMainData>
                <SubmitButton type='submit' isDisabled={false} isSubmitting={isSubmitting} onClick={handleSubmit}>
                    Confirm
                </SubmitButton>
            </div>
        </>
    )
}

export default OffRampSwapConfirmationStep;
