import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0F172A',
  color: '#FFFFFF',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export function notifySuccess(message) {
  Toast.fire({
    icon: 'success',
    title: message
  });
}

export function notifyInfo(message) {
  Toast.fire({
    icon: 'info',
    title: message
  });
}

export function notifyWarning(message) {
  Toast.fire({
    icon: 'warning',
    title: message
  });
}

export function showErrorAlert(title, message) {
  return Swal.fire({
    icon: 'error',
    title: title || 'Koneksi Supabase Bermasalah',
    text: message || 'Gagal tersambung ke database Supabase.',
    confirmButtonColor: '#DC2626',
    confirmButtonText: 'Tutup',
    background: '#FFFFFF',
    color: '#0F172A',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-2xl font-sans',
      confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-xs',
    }
  });
}

export function confirmActionAlert({ title, text, confirmButtonText, confirmButtonColor = '#DC2626' }) {
  return Swal.fire({
    title: title || 'Apakah Anda yakin?',
    text: text || 'Tindakan ini akan disimpan ke database Supabase.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#64748B',
    confirmButtonText: confirmButtonText || 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
    background: '#FFFFFF',
    color: '#0F172A',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-2xl font-sans',
      confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-xs',
      cancelButton: 'rounded-xl px-4 py-2.5 font-semibold text-xs',
    }
  });
}
